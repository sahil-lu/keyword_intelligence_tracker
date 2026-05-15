import OpenAI from "openai"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { generateReport } from "./reportGenerator.js"

export const MODEL_NAMES = [
	"DEFAULT",
	"OPENAI_DEEP_RESEARCH",
	"GEMINI_DEEP_RESEARCH_MAX",
	"PERPLEXITY",
]

const MODEL_LABELS = {
	DEFAULT: "Default",
	OPENAI_DEEP_RESEARCH: "OpenAI Deep Research",
	GEMINI_DEEP_RESEARCH_MAX: "Gemini Deep Research Max",
	PERPLEXITY: "Perplexity",
}

const VALID_AGENTS = new Set([
	"jobs",
	"skills",
	"policy",
	"program",
	"competitor",
])

function normalizeSelectedModels(models) {
	const selected = Array.isArray(models)
		? models.filter(model => MODEL_NAMES.includes(model))
		: []
	return [...new Set(["DEFAULT", ...selected])]
}

function clone(value) {
	return JSON.parse(JSON.stringify(value || null))
}

function modelPayload(report, signals, metadata = {}) {
	return {
		report,
		signals,
		createdAt: new Date().toISOString(),
		...metadata,
	}
}

function fallbackModelReport(modelName, baseReport, signals, reason) {
	const report = clone(baseReport)
	report.executive_summary = `${MODEL_LABELS[modelName]} analysis is using the default intelligence output for now. ${reason}`
	return modelPayload(report, clone(signals), {
		status: "fallback",
		error: reason,
	})
}

function log(stage, data) {
	const ts = new Date().toISOString()
	console.log(JSON.stringify({ ts, stage, ...data }))
}

// ---------------------------------------------------------------------------
// Research prompt — used by every non-DEFAULT model
// ---------------------------------------------------------------------------

function buildResearchPrompt(project) {
	const keywords = (project.keywords || [project.keyword])
		.filter(Boolean)
		.join(", ")
	const competitors = (project.competitors || []).join(", ")
	const domains = (project.competitorDomains || []).join(", ")

	return `You are an independent strategic intelligence researcher for "${project.name || "ITM Institute"}".

RESEARCH MANDATE:
Conduct thorough, independent web research to find the LATEST real-world developments related to:

Keywords: ${keywords}
${competitors ? `Competitors: ${competitors}` : ""}
${domains ? `Competitor Websites: ${domains}` : ""}

RESEARCH AREAS (cover as many as possible):
1. JOBS & RECRUITMENT — hiring trends, placement rates, salary data, employer demand changes
2. SKILLS & TECHNOLOGY — emerging skills, curriculum shifts, AI/tech adoption, certification trends
3. POLICY & REGULATION — government policies, UGC/AICTE regulations, NEP updates, accreditation changes
4. PROGRAMS & ACADEMICS — new program launches, admission trends, fee changes, partnership announcements
5. COMPETITIVE INTELLIGENCE — competitor moves, rankings, partnerships, new offerings by ${competitors || "competitors"}

RULES:
- Search the web for CURRENT, REAL information — do NOT hallucinate or fabricate sources.
- Every signal MUST be based on a specific real finding with a real source URL.
- Be specific: "UGC published new guidelines on X" is good; "There are trends in education" is bad.
- Find at least 8–15 distinct signals spread across the categories above.
- Each signal must have a different, specific finding — no duplicates or rewordings.

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "executive_summary": "3–5 sentence strategic summary of your most important findings",
  "signals": [
    {
      "title": "concise signal title",
      "agent": "jobs | skills | policy | program | competitor",
      "what_changed": "specific factual finding from your research — cite the source",
      "impact_on_itm": "specific strategic consequence for ${project.name || "ITM Institute"}",
      "recommended_action": "direct, actionable step to take",
      "priority": "HIGH | MEDIUM | LOW",
      "confidence_score": 0.0,
      "url": "source URL"
    }
  ],
  "recommendations": [
    {
      "action": "specific actionable recommendation",
      "priority": "HIGH | MEDIUM | LOW",
      "context": "why this matters",
      "confidence_score": 0.0
    }
  ]
}`
}

// ---------------------------------------------------------------------------
// Shared utilities for parsing model output
// ---------------------------------------------------------------------------

function safeParseJSON(raw) {
	const text = String(raw || "{}").trim()
	const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
	const clean = fenced ? fenced[1].trim() : text
	try {
		return JSON.parse(clean)
	} catch {
		return {}
	}
}

function normalizeModelSignals(rawSignals, modelName) {
	return (rawSignals || [])
		.filter(s => s && (s.title || s.what_changed))
		.map(s => {
			const agent = String(s.agent || "program")
				.toLowerCase()
				.trim()
			const priority = String(s.priority || "MEDIUM")
				.toUpperCase()
				.trim()
			return {
				title: String(s.title || ""),
				agent: VALID_AGENTS.has(agent) ? agent : "program",
				what_changed: String(s.what_changed || ""),
				impact_on_itm: String(s.impact_on_itm || ""),
				recommended_action: String(s.recommended_action || ""),
				priority: ["HIGH", "MEDIUM", "LOW"].includes(priority)
					? priority
					: "MEDIUM",
				priority_score:
					priority === "HIGH" ? 90 : priority === "MEDIUM" ? 50 : 20,
				confidence_score: Math.max(
					0,
					Math.min(1, Number(s.confidence_score) || 0.5)
				),
				url: String(s.url || ""),
				change_type: "new",
				source_type: "model_research",
				source_provider: modelName.toLowerCase(),
			}
		})
}

function buildModelReport(parsed, signals, project) {
	const report = generateReport(signals, project, 0, null)
	if (parsed.executive_summary) {
		report.executive_summary = parsed.executive_summary
	}
	if (
		Array.isArray(parsed.recommendations) &&
		parsed.recommendations.length > 0
	) {
		report.recommendations = parsed.recommendations
	}
	return report
}

// ---------------------------------------------------------------------------
// OpenAI Deep Research — uses Responses API with live web search
// ---------------------------------------------------------------------------

async function runOpenAIDeepResearch(project, data) {
	if (!process.env.OPENAI_API_KEY) {
		return fallbackModelReport(
			"OPENAI_DEEP_RESEARCH",
			data.defaultReport,
			data.signals,
			"OPENAI_API_KEY is not configured."
		)
	}

	const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
	const prompt = buildResearchPrompt(project)
	const model = process.env.OPENAI_DEEP_RESEARCH_MODEL || "gpt-4.1-mini"

	log("model:openai:start", { model })

	let raw = "{}"
	let citations = []

	try {
		const response = await client.responses.create({
			model,
			tools: [{ type: "web_search", search_context_size: "high" }],
			tool_choice: "required",
			input: prompt,
			instructions:
				"You are a senior strategic intelligence analyst. Conduct thorough live web research. Return ONLY valid JSON — no markdown fences, no prose.",
		})

		const msg = (response.output || []).find(o => o.type === "message")
		const text = (msg?.content || []).find(c => c.type === "output_text")
		raw = text?.text || response.output_text || "{}"
		citations = (text?.annotations || []).filter(
			a => a.type === "url_citation"
		)

		log("model:openai:search_done", {
			searches: (response.output || []).filter(
				o => o.type === "web_search_call"
			).length,
			citations: citations.length,
		})
	} catch (responsesErr) {
		log("model:openai:responses_fallback", {
			error: responsesErr.message,
		})
		const completion = await client.chat.completions.create({
			model,
			response_format: { type: "json_object" },
			messages: [
				{
					role: "system",
					content:
						"You are a senior strategy analyst. Return ONLY valid JSON.",
				},
				{ role: "user", content: prompt },
			],
			temperature: 0.3,
		})
		raw = completion.choices[0]?.message?.content || "{}"
	}

	const parsed = safeParseJSON(raw)
	const signals = normalizeModelSignals(
		parsed.signals,
		"OPENAI_DEEP_RESEARCH"
	)

	if (citations.length > 0) {
		let ci = 0
		for (const signal of signals) {
			if (!signal.url && ci < citations.length) {
				signal.url = citations[ci].url
				ci++
			}
		}
	}

	log("model:openai:done", { signals: signals.length })

	if (signals.length === 0) {
		return fallbackModelReport(
			"OPENAI_DEEP_RESEARCH",
			data.defaultReport,
			data.signals,
			"Model returned no signals from its research."
		)
	}

	const report = buildModelReport(parsed, signals, project)
	return modelPayload(report, signals, { status: "completed" })
}

// ---------------------------------------------------------------------------
// Gemini Deep Research — uses Google Search grounding
// ---------------------------------------------------------------------------

async function runGeminiDeepResearch(project, data) {
	if (!process.env.GEMINI_API_KEY) {
		return fallbackModelReport(
			"GEMINI_DEEP_RESEARCH_MAX",
			data.defaultReport,
			data.signals,
			"GEMINI_API_KEY is not configured."
		)
	}

	const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
	const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash"
	const prompt = buildResearchPrompt(project)

	log("model:gemini:start", { model: modelName })

	const model = genAI.getGenerativeModel({
		model: modelName,
		generationConfig: {
			responseMimeType: "application/json",
			temperature: 0.3,
		},
	})

	let raw = "{}"
	try {
		const result = await model.generateContent({
			contents: [{ role: "user", parts: [{ text: prompt }] }],
			tools: [{ googleSearch: {} }],
			systemInstruction: {
				parts: [
					{
						text: "You are a senior strategic intelligence analyst. Conduct thorough web research using Google Search. Return ONLY valid JSON.",
					},
				],
			},
		})
		raw = result.response.text()
	} catch (groundedErr) {
		log("model:gemini:grounding_fallback", {
			error: groundedErr.message,
		})
		const result = await model.generateContent({
			contents: [{ role: "user", parts: [{ text: prompt }] }],
			systemInstruction: {
				parts: [
					{
						text: "You are a senior strategic intelligence analyst. Return ONLY valid JSON.",
					},
				],
			},
		})
		raw = result.response.text()
	}

	const parsed = safeParseJSON(raw)
	const signals = normalizeModelSignals(
		parsed.signals,
		"GEMINI_DEEP_RESEARCH_MAX"
	)

	log("model:gemini:done", { signals: signals.length })

	if (signals.length === 0) {
		return fallbackModelReport(
			"GEMINI_DEEP_RESEARCH_MAX",
			data.defaultReport,
			data.signals,
			"Model returned no signals from its research."
		)
	}

	const report = buildModelReport(parsed, signals, project)
	return modelPayload(report, signals, { status: "completed" })
}

// ---------------------------------------------------------------------------
// Perplexity — built-in web search via sonar models
// ---------------------------------------------------------------------------

async function runPerplexity(project, data) {
	if (!process.env.PERPLEXITY_API_KEY) {
		return fallbackModelReport(
			"PERPLEXITY",
			data.defaultReport,
			data.signals,
			"PERPLEXITY_API_KEY is not configured."
		)
	}

	const client = new OpenAI({
		apiKey: process.env.PERPLEXITY_API_KEY,
		baseURL: "https://api.perplexity.ai",
	})

	const modelName = process.env.PERPLEXITY_MODEL || "sonar-pro"
	const prompt = buildResearchPrompt(project)

	log("model:perplexity:start", { model: modelName })

	const completion = await client.chat.completions.create({
		model: modelName,
		messages: [
			{
				role: "system",
				content:
					"You are a senior strategic intelligence analyst. Search the web thoroughly and return ONLY valid JSON — no markdown fences, no commentary.",
			},
			{ role: "user", content: prompt },
		],
		temperature: 0.3,
	})

	const raw = completion.choices[0]?.message?.content || "{}"
	const parsed = safeParseJSON(raw)
	const signals = normalizeModelSignals(parsed.signals, "PERPLEXITY")

	log("model:perplexity:done", { signals: signals.length })

	if (signals.length === 0) {
		return fallbackModelReport(
			"PERPLEXITY",
			data.defaultReport,
			data.signals,
			"Model returned no signals from its research."
		)
	}

	const report = buildModelReport(parsed, signals, project)
	return modelPayload(report, signals, { status: "completed" })
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export async function runModels(project, data) {
	const selectedModels = normalizeSelectedModels(project.selectedModels)
	const modelReports = {}

	for (const modelName of selectedModels) {
		try {
			if (modelName === "DEFAULT") {
				modelReports.DEFAULT = modelPayload(
					clone(data.defaultReport),
					clone(data.signals),
					{ status: "completed" }
				)
			} else if (modelName === "OPENAI_DEEP_RESEARCH") {
				modelReports.OPENAI_DEEP_RESEARCH = await runOpenAIDeepResearch(
					project,
					data
				)
			} else if (modelName === "GEMINI_DEEP_RESEARCH_MAX") {
				modelReports.GEMINI_DEEP_RESEARCH_MAX =
					await runGeminiDeepResearch(project, data)
			} else if (modelName === "PERPLEXITY") {
				modelReports.PERPLEXITY = await runPerplexity(project, data)
			}
		} catch (err) {
			log("model:error", { model: modelName, error: err.message })
			modelReports[modelName] = fallbackModelReport(
				modelName,
				data.defaultReport,
				data.signals,
				err.message || "Model execution failed."
			)
		}
	}

	return modelReports
}

export function mergeModelReports(
	modelReports,
	project,
	discardedCount,
	previousTrend
) {
	const seen = new Set()
	const mergedSignals = []

	for (const modelReport of Object.values(modelReports || {})) {
		for (const signal of modelReport.signals || []) {
			const key = [
				signal.url || "",
				signal.title || "",
				signal.what_changed || "",
			].join("|")
			if (seen.has(key)) continue
			seen.add(key)
			mergedSignals.push(signal)
		}
	}

	return generateReport(mergedSignals, project, discardedCount, previousTrend)
}

export { normalizeSelectedModels }

import OpenAI from "openai"

const client = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const VALID_AGENTS = new Set([
	"jobs",
	"skills",
	"policy",
	"program",
	"competitor",
])

const AGENT_KEYWORDS = {
	jobs: [
		"hiring",
		"recruit",
		"employ",
		"job",
		"placement",
		"career",
		"workforce",
		"talent",
		"salary",
		"intern",
	],
	skills: [
		"skill",
		"competenc",
		"training",
		"upskill",
		"certification",
		"technology",
		"ai ",
		"machine learning",
		"data science",
		"curriculum",
	],
	policy: [
		"ugc",
		"aicte",
		"regulation",
		"policy",
		"guideline",
		"compliance",
		"accreditation",
		"exam",
		"nep ",
		"ministry",
	],
	program: [
		"course",
		"program",
		"degree",
		"mba",
		"diploma",
		"admission",
		"fee",
		"tuition",
		"scholarship",
		"syllabus",
	],
	competitor: [],
}

function reclassifyAgent(text, competitors = []) {
	const lower = text.toLowerCase()

	for (const c of competitors) {
		if (c && lower.includes(c.toLowerCase())) return "competitor"
	}

	let bestAgent = null
	let bestScore = 0

	for (const [agent, keywords] of Object.entries(AGENT_KEYWORDS)) {
		if (agent === "competitor") continue
		let score = 0
		for (const kw of keywords) {
			if (lower.includes(kw)) score++
		}
		if (score > bestScore) {
			bestScore = score
			bestAgent = agent
		}
	}

	return bestScore >= 2 ? bestAgent : "program"
}

export async function analyzeContent(text, context = {}) {
	const trimmed = (text || "").slice(0, 10_000)
	if (!trimmed.trim()) {
		return {
			title: "No readable content",
			agent: "other",
			what_changed: "No content available for analysis.",
			impact_on_itm: "",
			recommended_action: "",
			priority: "low",
			confidence_score: 0,
		}
	}

	const keyword = context.keyword || ""
	const competitors = Array.isArray(context.competitors)
		? context.competitors.join(", ")
		: ""

	const prompt = `You are a senior strategy analyst for ITM Institute, a leading Indian education group.

Analyze the content below and extract ONE strategic signal relevant to ITM.

Context:
- Keyword: ${keyword}
- Competitors: ${competitors}

Content:
"""
${trimmed}
"""

STRICT RULES:
1. "what_changed" must describe a SPECIFIC, concrete change — not a summary of the article. Bad: "Article discusses trends." Good: "UGC released new guidelines mandating 40% online coursework for hybrid degrees."
2. "impact_on_itm" must describe a SPECIFIC strategic consequence for ITM. Bad: "This is relevant to ITM." Good: "ITM's current MBA program does not meet the 40% online threshold, risking accreditation issues by Q3 2026."
3. "recommended_action" must be a DIRECT, actionable step. Bad: "Monitor this." Good: "Redesign MBA curriculum to include 40% online modules and submit revised syllabus to UGC by August."
4. "priority" should be "high" only if immediate action is needed, "medium" if planning is required, "low" if informational.
5. "confidence_score" (0.0 to 1.0) — how confident you are that this signal is accurate and actionable. Consider: source credibility, specificity of claims, relevance to ITM.

Return a single JSON object:
{
  "title": "concise signal title",
  "agent": "jobs | skills | policy | program | competitor",
  "what_changed": "specific factual change",
  "impact_on_itm": "specific strategic consequence for ITM",
  "recommended_action": "direct actionable step",
  "priority": "high | medium | low",
  "confidence_score": 0.0
}`

	const completion = await client().chat.completions.create({
		model: process.env.OPENAI_MODEL || "gpt-4o-mini",
		response_format: { type: "json_object" },
		messages: [
			{
				role: "system",
				content:
					"You are a senior strategy analyst for ITM Institute. You output only valid JSON. Every field must be specific and actionable — never vague or generic.",
			},
			{ role: "user", content: prompt },
		],
		temperature: 0.2,
	})

	const raw = completion.choices[0]?.message?.content || "{}"
	let parsed
	try {
		parsed = JSON.parse(raw)
	} catch {
		parsed = {
			title: "Parse error",
			agent: "other",
			what_changed: raw.slice(0, 500),
			impact_on_itm: "",
			recommended_action: "",
			priority: "low",
			confidence_score: 0,
		}
	}

	let rawAgent = String(parsed.agent ?? "other")
		.toLowerCase()
		.trim()
	const rawPriority = String(parsed.priority ?? "low")
		.toLowerCase()
		.trim()
	const rawConfidence = Number(parsed.confidence_score) || 0

	if (!VALID_AGENTS.has(rawAgent)) {
		const allText = `${parsed.title} ${parsed.what_changed} ${parsed.impact_on_itm}`
		rawAgent = reclassifyAgent(allText, context.competitors || [])
	}

	return {
		title: String(parsed.title ?? ""),
		agent: VALID_AGENTS.has(rawAgent) ? rawAgent : "program",
		what_changed: String(parsed.what_changed ?? ""),
		impact_on_itm: String(parsed.impact_on_itm ?? ""),
		recommended_action: String(parsed.recommended_action ?? ""),
		priority: ["high", "medium", "low"].includes(rawPriority)
			? rawPriority.toUpperCase()
			: "LOW",
		confidence_score: Math.max(0, Math.min(1, rawConfidence)),
	}
}

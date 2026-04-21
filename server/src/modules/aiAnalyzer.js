import OpenAI from "openai"

const client = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const VALID_AGENTS = new Set([
	"jobs",
	"skills",
	"policy",
	"program",
	"competitor",
])

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
		}
	}

	const keyword = context.keyword || ""
	const competitors = Array.isArray(context.competitors)
		? context.competitors.join(", ")
		: ""

	const prompt = `You are an AI strategy analyst for ITM Institute.

Analyze the content below.

Keyword context: ${keyword}
Competitors: ${competitors}

Content:
"""
${trimmed}
"""

Return JSON:

{
  "title": "",
  "agent": "jobs | skills | policy | program | competitor",
  "what_changed": "",
  "impact_on_itm": "",
  "recommended_action": "",
  "priority": "high | medium | low"
}`

	const completion = await client().chat.completions.create({
		model: process.env.OPENAI_MODEL || "gpt-4o-mini",
		response_format: { type: "json_object" },
		messages: [
			{
				role: "system",
				content:
					"You are an AI strategy analyst for ITM Institute. You output only valid JSON objects.",
			},
			{ role: "user", content: prompt },
		],
		temperature: 0.3,
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
		}
	}

	const rawAgent = String(parsed.agent ?? "other")
		.toLowerCase()
		.trim()
	const rawPriority = String(parsed.priority ?? "low")
		.toLowerCase()
		.trim()

	return {
		title: String(parsed.title ?? ""),
		agent: VALID_AGENTS.has(rawAgent) ? rawAgent : "other",
		what_changed: String(parsed.what_changed ?? ""),
		impact_on_itm: String(parsed.impact_on_itm ?? ""),
		recommended_action: String(parsed.recommended_action ?? ""),
		priority: ["high", "medium", "low"].includes(rawPriority)
			? rawPriority.toUpperCase()
			: "LOW",
	}
}

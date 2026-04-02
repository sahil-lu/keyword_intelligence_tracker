import OpenAI from "openai"

const client = () =>
	new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	})

/**
 * Uses OpenAI to summarize a page and emit structured JSON fields.
 */
export async function analyzeContent(text, context = {}) {
	const trimmed = (text || "").slice(0, 10_000)
	if (!trimmed.trim()) {
		return {
			summary: "No readable content.",
			category: "unknown",
			why_it_matters: "Nothing to analyze.",
			suggested_action: "Skip or try another URL.",
		}
	}

	const keyword = context.keyword || ""
	const competitors = Array.isArray(context.competitors)
		? context.competitors.join(", ")
		: ""

	const prompt = `You analyze web content for a keyword monitoring product.
Keyword: ${keyword}
Competitors (names may appear in text): ${competitors}

Content:
"""
${trimmed}
"""

Return a single JSON object with keys: summary (string), category (string), why_it_matters (string), suggested_action (string). Be concise.`

	const completion = await client().chat.completions.create({
		model: process.env.OPENAI_MODEL || "gpt-4o-mini",
		response_format: { type: "json_object" },
		messages: [
			{ role: "system", content: "You output only valid JSON objects." },
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
			summary: raw.slice(0, 500),
			category: "unknown",
			why_it_matters: "Parse error from model output.",
			suggested_action: "Re-run or inspect raw model output.",
		}
	}

	return {
		summary: String(parsed.summary ?? ""),
		category: String(parsed.category ?? ""),
		why_it_matters: String(parsed.why_it_matters ?? ""),
		suggested_action: String(parsed.suggested_action ?? ""),
	}
}

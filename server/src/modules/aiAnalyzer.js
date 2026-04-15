import OpenAI from "openai"

const client = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function analyzeContent(text, context = {}) {
	const trimmed = (text || "").slice(0, 10_000)
	if (!trimmed.trim()) {
		return {
			summary: "No readable content.",
			entity: "unknown",
			category: "other",
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

Return a single JSON object with these exact keys:
- summary (string, 1-2 concise sentences about the content)
- entity (string, the main company/product/person this content is about)
- category (string, exactly one of: pricing, product, news, analysis, review, comparison, partnership, regulation, other)
- why_it_matters (string, 1 sentence explaining relevance to the keyword/market)
- suggested_action (string, 1 sentence actionable recommendation)`

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
			entity: "unknown",
			category: "other",
			why_it_matters: "Parse error from model output.",
			suggested_action: "Re-run or inspect raw model output.",
		}
	}

	const VALID_CATEGORIES = new Set([
		"pricing",
		"product",
		"news",
		"analysis",
		"review",
		"comparison",
		"partnership",
		"regulation",
		"other",
	])

	const rawCategory = String(parsed.category ?? "other").toLowerCase()

	return {
		summary: String(parsed.summary ?? ""),
		entity: String(parsed.entity ?? "unknown"),
		category: VALID_CATEGORIES.has(rawCategory) ? rawCategory : "other",
		why_it_matters: String(parsed.why_it_matters ?? ""),
		suggested_action: String(parsed.suggested_action ?? ""),
	}
}

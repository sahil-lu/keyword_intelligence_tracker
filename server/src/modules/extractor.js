import axios from "axios"
import * as cheerio from "cheerio"

const MAX_CHARS = 12_000

/**
 * Fetches HTML and pulls main paragraph text (MVP: no JS rendering).
 */
export async function extractContent(url) {
	try {
		const { data: html } = await axios.get(url, {
			timeout: 15_000,
			maxRedirects: 5,
			headers: {
				"User-Agent":
					"KeywordIntelligenceRadar/1.0 (+https://example.invalid; research MVP)",
				Accept: "text/html,application/xhtml+xml",
			},
			validateStatus: s => s >= 200 && s < 400,
		})

		const $ = cheerio.load(html)
		$("script, style, noscript, svg, iframe").remove()

		const parts = []
		$("p").each((_, el) => {
			const t = $(el).text().replace(/\s+/g, " ").trim()
			if (t.length > 40) parts.push(t)
		})

		let text = parts.join("\n\n")
		if (!text) {
			text = $("body").text().replace(/\s+/g, " ").trim()
		}
		if (text.length > MAX_CHARS) {
			text = `${text.slice(0, MAX_CHARS)}…`
		}

		return { url, text: text || "(no extractable text)" }
	} catch (err) {
		console.warn(`extractContent failed for ${url}:`, err.message)
		return { url, text: "" }
	}
}

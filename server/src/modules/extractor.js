import axios from "axios"
import * as cheerio from "cheerio"

const MAX_CHARS = 12_000

function log(stage, data) {
	const ts = new Date().toISOString()
	console.log(JSON.stringify({ ts, stage, ...data }))
}

export async function extractContent(url) {
	const firecrawlKey = process.env.FIRECRAWL_API_KEY

	if (firecrawlKey) {
		try {
			const result = await firecrawlExtract(url, firecrawlKey)
			if (result.text && result.text.length > 50) {
				log("extractor:firecrawl:ok", {
					url,
					chars: result.text.length,
				})
				return result
			}
		} catch (err) {
			log("extractor:firecrawl:fail", { url, error: err.message })
		}
	}

	return cheerioExtract(url)
}

async function firecrawlExtract(url, apiKey) {
	const { data } = await axios.post(
		"https://api.firecrawl.dev/v1/scrape",
		{
			url,
			formats: ["markdown"],
		},
		{
			timeout: 30_000,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
		}
	)

	let text = data?.data?.markdown || data?.data?.content || ""
	if (text.length > MAX_CHARS) {
		text = `${text.slice(0, MAX_CHARS)}…`
	}

	return { url, text: text || "(no extractable text)" }
}

async function cheerioExtract(url) {
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
		log("extractor:cheerio:fail", { url, error: err.message })
		return { url, text: "" }
	}
}

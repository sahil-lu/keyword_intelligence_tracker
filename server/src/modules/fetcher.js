import axios from "axios"

function log(stage, data) {
	const ts = new Date().toISOString()
	console.log(JSON.stringify({ ts, stage, ...data }))
}

export async function fetchResults(queries) {
	const useMock = process.env.USE_MOCK_SEARCH !== "false"
	if (useMock) {
		log("fetcher:mock", { queries: queries.length })
		return mockFetch(queries)
	}

	const tavilyKey = process.env.TAVILY_API_KEY
	const exaKey = process.env.EXA_API_KEY

	if (!tavilyKey && !exaKey) {
		log("fetcher:warn", {
			message: "No TAVILY_API_KEY or EXA_API_KEY; using mock",
		})
		return mockFetch(queries)
	}

	const results = []

	if (tavilyKey) {
		for (const q of queries) {
			try {
				const batch = await tavilySearch(q, tavilyKey)
				results.push(...batch)
			} catch (err) {
				log("fetcher:tavily:error", { query: q, error: err.message })
			}
		}
		log("fetcher:tavily", { results: results.length })
	}

	if (exaKey) {
		const before = results.length
		for (const q of queries) {
			try {
				const batch = await exaSearch(q, exaKey)
				results.push(...batch)
			} catch (err) {
				log("fetcher:exa:error", { query: q, error: err.message })
			}
		}
		log("fetcher:exa", { results: results.length - before })
	}

	return results
}

export async function fetchDirectUrls(urls) {
	return urls
		.filter(u => typeof u === "string" && u.trim())
		.map(u => ({ url: u.trim(), title: u.trim() }))
}

function mockFetch(queries) {
	const out = []
	let i = 0
	for (const q of queries) {
		out.push({
			url: `https://example.org/radar/${encodeURIComponent(q)}/overview`,
			title: `Overview: ${q}`,
		})
		out.push({
			url: `https://example.org/radar/${encodeURIComponent(q)}/news-${i++}`,
			title: `Latest on ${q}`,
		})
	}
	return out
}

async function tavilySearch(query, apiKey) {
	const url = "https://api.tavily.com/search"
	const { data } = await axios.post(
		url,
		{
			api_key: apiKey,
			query,
			max_results: 5,
			search_depth: "basic",
		},
		{
			timeout: 20_000,
			headers: { "Content-Type": "application/json" },
		}
	)

	const results = data?.results || []
	return results.map(r => ({
		url: r.url,
		title: r.title || r.url,
		source_type: "search",
	}))
}

async function exaSearch(query, apiKey) {
	const url = "https://api.exa.ai/search"
	const { data } = await axios.post(
		url,
		{
			query,
			numResults: 5,
			useAutoprompt: true,
		},
		{
			timeout: 20_000,
			headers: {
				"Content-Type": "application/json",
				"x-api-key": apiKey,
			},
		}
	)

	const results = data?.results || []
	return results.map(r => ({
		url: r.url,
		title: r.title || r.url,
		source_type: "search",
	}))
}

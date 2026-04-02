import axios from "axios"

/**
 * MVP: mock SERP rows by default. Set USE_MOCK_SEARCH=false and provide
 * TAVILY_API_KEY for a simple real search (Tavily API).
 */
export async function fetchResults(queries) {
	const useMock = process.env.USE_MOCK_SEARCH !== "false"
	if (useMock) {
		return mockFetch(queries)
	}

	const key = process.env.TAVILY_API_KEY
	if (!key) {
		console.warn("TAVILY_API_KEY missing; falling back to mock results.")
		return mockFetch(queries)
	}

	const all = []
	for (const q of queries) {
		const batch = await tavilySearch(q, key)
		all.push(...batch)
	}
	return all
}

function mockFetch(queries) {
	const out = []
	let i = 0
	for (const q of queries) {
		// Deterministic-looking placeholder URLs per query for demos/tests.
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
			headers: {
				"Content-Type": "application/json",
			},
		}
	)

	const results = data?.results || []
	return results.map(r => ({
		url: r.url,
		title: r.title || r.url,
	}))
}

export function generateQueries(project) {
	const keywords = (
		Array.isArray(project.keywords) && project.keywords.length > 0
			? project.keywords
			: [project.keyword]
	)
		.map(k => String(k || "").trim())
		.filter(Boolean)
	const competitors = Array.isArray(project.competitors)
		? project.competitors
		: []
	const competitorDomains = Array.isArray(project.competitorDomains)
		? project.competitorDomains
		: []

	if (keywords.length === 0) return []

	const queries = []

	for (const keyword of keywords) {
		queries.push(
			keyword,
			`${keyword} UGC guidelines`,
			`${keyword} AICTE policy`,
			`${keyword} exam changes`,
			`${keyword} hiring trends`,
			`${keyword} job demand`,
			`${keyword} skill trends`,
			`${keyword} technology shifts`,
			`${keyword} new courses`,
			`${keyword} program pricing`
		)
	}

	for (const competitor of competitors) {
		const c = String(competitor).trim()
		if (!c) continue
		for (const keyword of keywords) {
			queries.push(`${c} ${keyword}`)
		}
		queries.push(`${c} new launch`)
		queries.push(`${c} fee structure`)
	}

	for (const domain of competitorDomains) {
		const d = String(domain).trim()
		if (!d) continue
		for (const keyword of keywords) {
			queries.push(`site:${d} ${keyword}`)
		}
	}

	return [...new Set(queries)]
}

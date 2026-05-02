export function generateQueries(project) {
	const keyword = (project.keyword || "").trim()
	const competitors = Array.isArray(project.competitors)
		? project.competitors
		: []
	const competitorDomains = Array.isArray(project.competitorDomains)
		? project.competitorDomains
		: []

	if (!keyword) return []

	const queries = [
		keyword,
		`${keyword} UGC guidelines`,
		`${keyword} AICTE policy`,
		`${keyword} exam changes`,
		`${keyword} hiring trends`,
		`${keyword} job demand`,
		`${keyword} skill trends`,
		`${keyword} technology shifts`,
		`${keyword} new courses`,
		`${keyword} program pricing`,
	]

	for (const competitor of competitors) {
		const c = String(competitor).trim()
		if (!c) continue
		queries.push(`${c} ${keyword}`)
		queries.push(`${c} new launch`)
		queries.push(`${c} fee structure`)
	}

	for (const domain of competitorDomains) {
		const d = String(domain).trim()
		if (!d) continue
		queries.push(`site:${d} ${keyword}`)
	}

	return [...new Set(queries)]
}

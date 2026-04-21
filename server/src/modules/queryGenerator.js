export function generateQueries(project) {
	const keyword = (project.keyword || "").trim()
	const competitors = Array.isArray(project.competitors)
		? project.competitors
		: []

	if (!keyword) return []

	const queries = [
		keyword,
		// Policy agent
		`${keyword} UGC guidelines`,
		`${keyword} AICTE policy`,
		`${keyword} exam changes`,
		// Jobs agent
		`${keyword} hiring trends`,
		`${keyword} job demand`,
		// Skills agent
		`${keyword} skill trends`,
		`${keyword} technology shifts`,
		// Program agent
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

	return [...new Set(queries)]
}

/**
 * Builds a small set of search-style queries from a project definition.
 */
export function generateQueries(project) {
	const keyword = (project.keyword || "").trim()
	const competitors = Array.isArray(project.competitors)
		? project.competitors
		: []

	const queries = [
		keyword,
		`${keyword} fees`,
		`${keyword} placements`,
	].filter(q => q.length > 0)

	for (const competitor of competitors) {
		const c = String(competitor).trim()
		if (c) queries.push(`${c} ${keyword}`)
	}

	return [...new Set(queries)]
}

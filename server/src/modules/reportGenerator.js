/**
 * Turns scored insights into a compact executive view.
 */
export function generateReport(insights) {
	const top = [...insights].sort((a, b) => {
		const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 }
		return (rank[b.score] || 0) - (rank[a.score] || 0)
	})

	const top_findings = top.slice(0, 8).map(i => ({
		url: i.url,
		title: i.title,
		changeType: i.changeType,
		score: i.score,
		summary: i.summary,
		category: i.category,
		why_it_matters: i.why_it_matters,
	}))

	const recommendations = top
		.map(i => i.suggested_action)
		.filter(Boolean)
		.slice(0, 6)

	const newCount = insights.filter(i => i.changeType === "new").length
	const executive_summary = `Analyzed ${insights.length} sources (${newCount} new URLs this run). Top themes: ${summarizeCategories(insights)}.`

	return {
		executive_summary,
		top_findings,
		recommendations,
	}
}

function summarizeCategories(insights) {
	const counts = {}
	for (const i of insights) {
		const c = i.category || "general"
		counts[c] = (counts[c] || 0) + 1
	}
	return Object.entries(counts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 4)
		.map(([k, v]) => `${k} (${v})`)
		.join(", ")
}

/**
 * Simple priority: competitor mention → HIGH, otherwise MEDIUM vs LOW by heuristics.
 */
export function scoreInsight(insight, competitors = []) {
	const hay =
		`${insight.summary} ${insight.category} ${insight.why_it_matters} ${insight.suggested_action}`.toLowerCase()

	for (const c of competitors) {
		const name = String(c).trim().toLowerCase()
		if (name && hay.includes(name)) {
			return "HIGH"
		}
	}

	if (
		hay.includes("pricing") ||
		hay.includes("fee") ||
		hay.includes("placement")
	) {
		return "MEDIUM"
	}

	return "LOW"
}

const HIGH_SIGNALS = [
	"pricing",
	"launch",
	"acquisition",
	"partnership",
	"funding",
	"market share",
	"revenue",
	"ipo",
	"breach",
	"shutdown",
]

const MEDIUM_SIGNALS = [
	"fee",
	"placement",
	"review",
	"comparison",
	"alternative",
	"trend",
	"update",
	"rebrand",
	"expansion",
]

export function scoreInsight(analysis, competitors = [], changeType = "new") {
	const hay =
		`${analysis.summary} ${analysis.entity} ${analysis.category} ${analysis.why_it_matters}`.toLowerCase()

	let score = 0

	for (const c of competitors) {
		const name = String(c).trim().toLowerCase()
		if (name && hay.includes(name)) {
			score += 3
			break
		}
	}

	if (changeType === "updated") score += 2
	if (changeType === "new") score += 1

	for (const signal of HIGH_SIGNALS) {
		if (hay.includes(signal)) {
			score += 1.5
			break
		}
	}

	for (const signal of MEDIUM_SIGNALS) {
		if (hay.includes(signal)) {
			score += 0.5
			break
		}
	}

	if (score >= 3) return "HIGH"
	if (score >= 1.5) return "MEDIUM"
	return "LOW"
}

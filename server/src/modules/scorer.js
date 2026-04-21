const HIGH_SIGNALS = [
	"ugc",
	"aicte",
	"policy change",
	"exam change",
	"regulation",
	"new policy",
	"cat exam",
	"admission change",
	"fee hike",
	"new launch",
	"acquisition",
	"partnership",
	"funding",
	"shutdown",
	"merger",
]

const MEDIUM_SIGNALS = [
	"skill trend",
	"hiring trend",
	"ai demand",
	"new course",
	"program update",
	"placement",
	"industry shift",
	"technology shift",
	"curriculum",
	"ranking",
	"expansion",
]

export function scoreSignal(analysis, competitors = [], changeType = "new") {
	const llmPriority = String(analysis.priority || "").toUpperCase()

	const hay =
		`${analysis.what_changed} ${analysis.impact_on_itm} ${analysis.recommended_action} ${analysis.title}`.toLowerCase()

	let shouldOverride = false
	let overrideTo = llmPriority

	for (const c of competitors) {
		const name = String(c).trim().toLowerCase()
		if (name && hay.includes(name)) {
			if (llmPriority === "LOW") {
				shouldOverride = true
				overrideTo = "MEDIUM"
			}
			break
		}
	}

	if (!shouldOverride) {
		for (const signal of HIGH_SIGNALS) {
			if (hay.includes(signal)) {
				if (llmPriority === "LOW" || llmPriority === "MEDIUM") {
					shouldOverride = true
					overrideTo = "HIGH"
				}
				break
			}
		}
	}

	if (!shouldOverride) {
		for (const signal of MEDIUM_SIGNALS) {
			if (hay.includes(signal)) {
				if (llmPriority === "LOW") {
					shouldOverride = true
					overrideTo = "MEDIUM"
				}
				break
			}
		}
	}

	if (changeType === "new" && llmPriority === "LOW") {
		shouldOverride = true
		overrideTo = "MEDIUM"
	}

	const finalPriority = shouldOverride ? overrideTo : llmPriority

	return ["HIGH", "MEDIUM", "LOW"].includes(finalPriority)
		? finalPriority
		: "LOW"
}

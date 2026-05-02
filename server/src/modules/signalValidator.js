const GENERIC_IMPACT = [
	"this is relevant",
	"may be important",
	"could be significant",
	"worth monitoring",
	"potentially relevant",
	"this may affect",
	"could impact",
	"is important for",
	"should be aware",
	"needs attention",
	"may influence",
	"relevant to itm",
	"itm should note",
]

const GENERIC_ACTION = [
	"monitor this",
	"keep watching",
	"stay updated",
	"continue monitoring",
	"watch for updates",
	"no action needed",
	"keep an eye",
	"track this",
	"be aware",
	"stay informed",
	"follow up",
	"review this",
	"assess the situation",
	"evaluate the impact",
]

function isGeneric(text, genericPhrases) {
	const lower = text.toLowerCase().trim()
	return genericPhrases.some(phrase => lower.includes(phrase))
}

function isTooVague(text, minLength = 20) {
	if (!text || text.trim().length < minLength) return true
	const words = text.trim().split(/\s+/)
	return words.length < 4
}

function semanticSimilarity(a, b) {
	const wordsA = new Set(
		a
			.toLowerCase()
			.split(/\s+/)
			.filter(w => w.length > 3)
	)
	const wordsB = new Set(
		b
			.toLowerCase()
			.split(/\s+/)
			.filter(w => w.length > 3)
	)
	if (wordsA.size === 0 || wordsB.size === 0) return 0
	let overlap = 0
	for (const w of wordsA) {
		if (wordsB.has(w)) overlap++
	}
	return overlap / Math.max(wordsA.size, wordsB.size)
}

export function validateSignal(signal) {
	if (!signal.impact_on_itm || signal.impact_on_itm.trim().length === 0) {
		return { valid: false, reason: "Empty impact_on_itm" }
	}

	if (isGeneric(signal.impact_on_itm, GENERIC_IMPACT)) {
		return {
			valid: false,
			reason: `Generic impact_on_itm: "${signal.impact_on_itm.slice(0, 80)}"`,
		}
	}

	if (isTooVague(signal.impact_on_itm)) {
		return {
			valid: false,
			reason: "impact_on_itm too vague (< 20 chars or < 4 words)",
		}
	}

	if (
		!signal.recommended_action ||
		signal.recommended_action.trim().length === 0
	) {
		return { valid: false, reason: "Empty recommended_action" }
	}

	if (isGeneric(signal.recommended_action, GENERIC_ACTION)) {
		return {
			valid: false,
			reason: `Generic recommended_action: "${signal.recommended_action.slice(0, 80)}"`,
		}
	}

	if (isTooVague(signal.recommended_action)) {
		return {
			valid: false,
			reason: "recommended_action too vague (< 20 chars or < 4 words)",
		}
	}

	if (!signal.what_changed || signal.what_changed.trim().length < 15) {
		return { valid: false, reason: "what_changed too short (< 15 chars)" }
	}

	if (
		signal.title &&
		signal.what_changed.trim().toLowerCase() ===
			signal.title.trim().toLowerCase()
	) {
		return { valid: false, reason: "what_changed just restates the title" }
	}

	if (
		signal.confidence_score !== undefined &&
		signal.confidence_score < 0.15
	) {
		return {
			valid: false,
			reason: `Confidence too low: ${signal.confidence_score}`,
		}
	}

	return { valid: true }
}

export function deduplicateSignals(signals) {
	const kept = []
	for (const signal of signals) {
		let isDuplicate = false
		for (const existing of kept) {
			const sim = semanticSimilarity(
				`${signal.what_changed} ${signal.impact_on_itm}`,
				`${existing.what_changed} ${existing.impact_on_itm}`
			)
			if (sim > 0.7) {
				isDuplicate = true
				break
			}
		}
		if (!isDuplicate) kept.push(signal)
	}
	return kept
}

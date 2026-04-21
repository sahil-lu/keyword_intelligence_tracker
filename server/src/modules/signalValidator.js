const GENERIC_IMPACT = [
	"this is relevant",
	"may be important",
	"could be significant",
	"worth monitoring",
	"potentially relevant",
	"this may affect",
	"could impact",
]

const GENERIC_ACTION = [
	"monitor this",
	"keep watching",
	"stay updated",
	"continue monitoring",
	"watch for updates",
	"no action needed",
	"keep an eye",
]

function isGeneric(text, genericPhrases) {
	const lower = text.toLowerCase().trim()
	return genericPhrases.some(phrase => lower.includes(phrase))
}

export function validateSignal(signal) {
	if (!signal.impact_on_itm || signal.impact_on_itm.trim().length === 0) {
		return { valid: false, reason: "Empty impact_on_itm" }
	}

	if (isGeneric(signal.impact_on_itm, GENERIC_IMPACT)) {
		return {
			valid: false,
			reason: `Generic impact_on_itm: "${signal.impact_on_itm}"`,
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
			reason: `Generic recommended_action: "${signal.recommended_action}"`,
		}
	}

	if (!signal.what_changed || signal.what_changed.trim().length < 10) {
		return { valid: false, reason: "what_changed too short (< 10 chars)" }
	}

	if (
		signal.title &&
		signal.what_changed.trim().toLowerCase() ===
			signal.title.trim().toLowerCase()
	) {
		return { valid: false, reason: "what_changed just restates the title" }
	}

	return { valid: true }
}

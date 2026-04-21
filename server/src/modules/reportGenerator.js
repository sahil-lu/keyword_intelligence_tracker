const PRIORITY_RANK = { HIGH: 3, MEDIUM: 2, LOW: 1 }
const AGENT_LABELS = {
	jobs: "Jobs",
	skills: "Skills",
	policy: "Policy",
	program: "Program",
	competitor: "Competitor",
	other: "Other",
}

function byPriority(a, b) {
	return (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0)
}

export function generateReport(signals, project = {}, discardedCount = 0) {
	const sorted = [...signals].sort(byPriority)

	const highCount = signals.filter(s => s.priority === "HIGH").length
	const mediumCount = signals.filter(s => s.priority === "MEDIUM").length
	const lowCount = signals.filter(s => s.priority === "LOW").length
	const newCount = signals.filter(s => s.change_type === "new").length

	const top_findings = sorted
		.filter(s => s.priority !== "LOW")
		.slice(0, 10)
		.map(s => ({
			url: s.url,
			title: s.title,
			agent: s.agent,
			what_changed: s.what_changed,
			impact_on_itm: s.impact_on_itm,
			recommended_action: s.recommended_action,
			change_type: s.change_type,
			priority: s.priority,
		}))

	const agentMap = {}
	for (const s of signals) {
		const agent = s.agent || "other"
		if (!agentMap[agent]) agentMap[agent] = []
		agentMap[agent].push(s)
	}

	const agent_summary = Object.entries(AGENT_LABELS).reduce(
		(acc, [key, label]) => {
			const items = agentMap[key] || []
			if (items.length === 0 && key !== "other") {
				acc.push({ agent: key, label, count: 0, top_signal: null })
				return acc
			}
			if (items.length === 0) return acc

			const topItem = [...items].sort(byPriority)[0]
			acc.push({
				agent: key,
				label,
				count: items.length,
				high_count: items.filter(i => i.priority === "HIGH").length,
				top_signal: topItem
					? {
							title: topItem.title,
							what_changed: topItem.what_changed,
							priority: topItem.priority,
						}
					: null,
			})
			return acc
		},
		[]
	)

	const executive_summary = buildExecutiveSummary(
		sorted,
		agent_summary,
		highCount,
		signals.length
	)

	const recommendations = sorted
		.filter(s => s.recommended_action && s.priority !== "LOW")
		.slice(0, 8)
		.map(s => ({
			action: s.recommended_action,
			priority: s.priority,
			context: `${AGENT_LABELS[s.agent] || s.agent} — ${s.title}`,
		}))

	return {
		executive_summary,
		top_findings,
		agent_summary,
		recommendations,
		stats: {
			total: signals.length,
			new: newCount,
			high: highCount,
			medium: mediumCount,
			low: lowCount,
			discarded: discardedCount,
		},
	}
}

function buildExecutiveSummary(sorted, agentSummary, highCount, totalCount) {
	if (!totalCount) {
		return "No signals detected this run. The landscape appears stable — no action required."
	}

	const high = sorted.filter(s => s.priority === "HIGH")

	let text = `${highCount} high-priority signal${highCount !== 1 ? "s" : ""} detected from ${totalCount} total sources. `

	const agentHighlights = agentSummary
		.filter(a => a.high_count > 0 && a.top_signal)
		.slice(0, 3)
		.map(a => `${a.label}: ${a.top_signal.what_changed}`)

	if (agentHighlights.length > 0) {
		text += agentHighlights.join(". ") + ". "
	}

	if (high.length > 0 && high[0].recommended_action) {
		text += `Top action: ${high[0].recommended_action}`
	}

	return text
}

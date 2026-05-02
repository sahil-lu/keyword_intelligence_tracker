const PRIORITY_RANK = { HIGH: 3, MEDIUM: 2, LOW: 1 }
const AGENT_LABELS = {
	jobs: "Jobs",
	skills: "Skills",
	policy: "Policy",
	program: "Program",
	competitor: "Competitor",
	other: "Other",
}

function byScore(a, b) {
	const scoreDiff = (b.priority_score || 0) - (a.priority_score || 0)
	if (scoreDiff !== 0) return scoreDiff
	return (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0)
}

export function generateReport(
	signals,
	project = {},
	discardedCount = 0,
	previousTrend = null
) {
	const sorted = [...signals].sort(byScore)

	const highCount = signals.filter(s => s.priority === "HIGH").length
	const mediumCount = signals.filter(s => s.priority === "MEDIUM").length
	const lowCount = signals.filter(s => s.priority === "LOW").length
	const newCount = signals.filter(s => s.change_type === "new").length
	const avgConfidence =
		signals.length > 0
			? Math.round(
					(signals.reduce(
						(sum, s) => sum + (s.confidence_score || 0),
						0
					) /
						signals.length) *
						100
				) / 100
			: 0

	const top_actions = sorted
		.filter(s => s.priority === "HIGH" && s.recommended_action)
		.slice(0, 3)
		.map(s => ({
			action: s.recommended_action,
			why: s.impact_on_itm,
			agent: s.agent,
			title: s.title,
			confidence_score: s.confidence_score || 0,
			source: s.url,
		}))

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
			confidence_score: s.confidence_score || 0,
			priority_score: s.priority_score || 0,
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
				acc.push({
					agent: key,
					label,
					count: 0,
					high_count: 0,
					top_signal: null,
				})
				return acc
			}
			if (items.length === 0) return acc

			const topItem = [...items].sort(byScore)[0]
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

	const delta = buildDelta(
		agent_summary,
		{ high: highCount, total: signals.length },
		previousTrend
	)

	const executive_summary = buildExecutiveSummary(
		sorted,
		agent_summary,
		highCount,
		signals.length,
		delta
	)

	const recommendations = sorted
		.filter(s => s.recommended_action && s.priority !== "LOW")
		.slice(0, 8)
		.map(s => ({
			action: s.recommended_action,
			priority: s.priority,
			context: `${AGENT_LABELS[s.agent] || s.agent} — ${s.title}`,
			confidence_score: s.confidence_score || 0,
		}))

	return {
		executive_summary,
		top_actions,
		top_findings,
		agent_summary,
		delta,
		recommendations,
		stats: {
			total: signals.length,
			new: newCount,
			high: highCount,
			medium: mediumCount,
			low: lowCount,
			discarded: discardedCount,
			avg_confidence: avgConfidence,
		},
	}
}

function buildDelta(agentSummary, currentStats, previousTrend) {
	if (!previousTrend) return null

	const changes = []

	for (const agent of agentSummary) {
		const prevCount = previousTrend.agents?.[agent.agent] || 0
		const diff = agent.count - prevCount
		if (diff !== 0) {
			const pct =
				prevCount > 0
					? Math.round((diff / prevCount) * 100)
					: diff > 0
						? 100
						: 0
			changes.push({
				agent: agent.agent,
				label: agent.label,
				previous: prevCount,
				current: agent.count,
				diff,
				pct,
			})
		}
	}

	const prevHigh = previousTrend.high || 0
	const highDiff = currentStats.high - prevHigh

	return {
		total_previous: previousTrend.total || 0,
		total_current: currentStats.total,
		total_diff: currentStats.total - (previousTrend.total || 0),
		high_previous: prevHigh,
		high_current: currentStats.high,
		high_diff: highDiff,
		agent_changes: changes
			.filter(c => c.diff !== 0)
			.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)),
	}
}

function buildExecutiveSummary(
	sorted,
	agentSummary,
	highCount,
	totalCount,
	delta
) {
	if (!totalCount) {
		return "No signals detected this run. The landscape appears stable — no action required."
	}

	const high = sorted.filter(s => s.priority === "HIGH")

	let text = `${highCount} high-priority signal${highCount !== 1 ? "s" : ""} detected from ${totalCount} total sources. `

	if (delta) {
		if (delta.high_diff > 0) {
			text += `(+${delta.high_diff} vs last run) `
		} else if (delta.high_diff < 0) {
			text += `(${delta.high_diff} vs last run) `
		}
	}

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

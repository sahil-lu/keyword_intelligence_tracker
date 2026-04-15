const PRIORITY_RANK = { HIGH: 3, MEDIUM: 2, LOW: 1 }

function byPriority(a, b) {
	return (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0)
}

function hostOf(url) {
	try {
		return new URL(url).hostname.replace(/^www\./, "")
	} catch {
		return url || "unknown"
	}
}

export function generateReport(insights, project = {}) {
	const sorted = [...insights].sort(byPriority)

	const highCount = insights.filter(i => i.priority === "HIGH").length
	const newCount = insights.filter(i => i.change_type === "new").length
	const updatedCount = insights.filter(
		i => i.change_type === "updated"
	).length

	const top_findings = sorted.slice(0, 10).map(i => ({
		url: i.url,
		title: i.title,
		entity: i.entity,
		category: i.category,
		summary: i.summary,
		change_type: i.change_type,
		priority: i.priority,
		why_it_matters: i.why_it_matters,
	}))

	const competitors = project.competitors || []
	const competitor_updates = competitors
		.map(comp => {
			const name = String(comp).toLowerCase()
			const items = sorted.filter(
				i =>
					String(i.entity).toLowerCase().includes(name) ||
					String(i.summary).toLowerCase().includes(name)
			)
			if (!items.length) return null
			return {
				competitor: comp,
				insights: items.slice(0, 5).map(i => ({
					title: i.title,
					summary: i.summary,
					priority: i.priority,
					url: i.url,
				})),
			}
		})
		.filter(Boolean)

	const domainMap = {}
	for (const i of insights) {
		const host = hostOf(i.url)
		if (!domainMap[host])
			domainMap[host] = { domain: host, count: 0, categories: new Set() }
		domainMap[host].count++
		domainMap[host].categories.add(i.category || "other")
	}
	const source_breakdown = Object.values(domainMap)
		.map(d => ({ ...d, categories: [...d.categories] }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 15)

	const what_changed = sorted
		.filter(i => i.change_type === "new" || i.change_type === "updated")
		.slice(0, 10)
		.map(i => ({
			url: i.url,
			title: i.title,
			change_type: i.change_type,
			summary: i.summary,
		}))

	const categoryMap = {}
	for (const i of insights) {
		const c = i.category || "other"
		categoryMap[c] = (categoryMap[c] || 0) + 1
	}
	const topCategories = Object.entries(categoryMap)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 4)
		.map(([k, v]) => `${k} (${v})`)
		.join(", ")

	const executive_summary =
		`Analyzed ${insights.length} sources — ${newCount} new, ${updatedCount} updated, ${highCount} high priority. ` +
		`Top categories: ${topCategories || "N/A"}.`

	const strategic_insights = buildStrategicInsights(sorted, competitors)

	const recommendations = sorted
		.filter(i => i.suggested_action && i.priority !== "LOW")
		.slice(0, 8)
		.map(i => ({
			action: i.suggested_action,
			priority: i.priority,
			context: `${i.entity} — ${i.category}`,
		}))

	return {
		executive_summary,
		top_findings,
		competitor_updates,
		source_breakdown,
		what_changed,
		strategic_insights,
		recommendations,
		stats: {
			total: insights.length,
			new: newCount,
			updated: updatedCount,
			high: highCount,
			medium: insights.filter(i => i.priority === "MEDIUM").length,
			low: insights.filter(i => i.priority === "LOW").length,
		},
	}
}

function buildStrategicInsights(sorted, competitors) {
	const high = sorted.filter(i => i.priority === "HIGH")
	if (!high.length) {
		return "No high-priority signals detected this run. The competitive landscape appears stable."
	}

	const themes = [...new Set(high.map(i => i.category))].join(", ")
	const entities = [
		...new Set(high.map(i => i.entity).filter(e => e !== "unknown")),
	]
		.slice(0, 3)
		.join(", ")
	const compMentions = competitors.filter(c =>
		high.some(i =>
			`${i.summary} ${i.entity}`.toLowerCase().includes(c.toLowerCase())
		)
	)

	let text = `${high.length} high-priority signal(s) detected across ${themes}. `
	if (entities) text += `Key entities: ${entities}. `
	if (compMentions.length)
		text += `Competitor activity: ${compMentions.join(", ")}. `
	text += "Review top findings and act on recommended items."
	return text
}

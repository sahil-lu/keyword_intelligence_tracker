/**
 * Drops duplicate URLs and trivial empty rows.
 */
export function deduplicate(items) {
	const seen = new Set()
	const out = []

	for (const item of items) {
		const url = typeof item?.url === "string" ? item.url.trim() : ""
		if (!url || seen.has(url)) continue
		seen.add(url)
		out.push({
			url,
			title: item.title || url,
		})
	}

	return out
}

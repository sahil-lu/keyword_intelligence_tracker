/**
 * MVP change detection: URL seen before vs new.
 */
export function detectChanges(newItems, existingItems) {
	const existingUrls = new Set(
		(existingItems || [])
			.map(x => (typeof x?.url === "string" ? x.url.trim() : ""))
			.filter(Boolean)
	)

	return newItems.map(item => ({
		...item,
		changeType: existingUrls.has(item.url) ? "existing" : "new",
	}))
}

/**
 * Compares items against existing document records.
 * Supports content-hash based detection: NEW → never seen, UPDATED → hash changed, EXISTING → unchanged.
 */
export function detectChanges(items, existingDocs = {}) {
	return items.map(item => {
		const existing = existingDocs[item.url]
		if (!existing) return { ...item, change_type: "new" }
		if (
			item.hash &&
			existing.contentHash &&
			existing.contentHash !== item.hash
		) {
			return { ...item, change_type: "updated" }
		}
		return { ...item, change_type: "existing" }
	})
}

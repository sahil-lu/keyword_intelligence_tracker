import { Router } from "express"
import { getFirestore } from "../db/firebase.js"

const router = Router()
const db = () => getFirestore()

router.get("/:id/findings", async (req, res) => {
	try {
		const { id } = req.params
		const { priority, category, change_type, limit: rawLimit } = req.query

		const projectSnap = await db().collection("projects").doc(id).get()
		if (!projectSnap.exists) {
			return res.status(404).json({ error: "Project not found" })
		}

		let query = db()
			.collection("projects")
			.doc(id)
			.collection("insights")
			.orderBy("createdAt", "desc")
			.limit(200)

		const snap = await query.get()
		let items = snap.docs.map(d => ({ id: d.id, ...d.data() }))

		if (priority) items = items.filter(i => i.priority === priority)
		if (category) items = items.filter(i => i.category === category)
		if (change_type)
			items = items.filter(i => i.change_type === change_type)

		const max = Math.min(Number(rawLimit) || 100, 200)
		items = items.slice(0, max)

		return res.json(items)
	} catch (err) {
		console.error("GET /projects/:id/findings", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

export default router

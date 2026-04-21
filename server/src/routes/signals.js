import { Router } from "express"
import { getFirestore } from "../db/firebase.js"

const router = Router()
const db = () => getFirestore()

router.get("/:id/signals", async (req, res) => {
	try {
		const { id } = req.params
		const { priority, agent, change_type, limit: rawLimit } = req.query

		const projectSnap = await db().collection("projects").doc(id).get()
		if (!projectSnap.exists) {
			return res.status(404).json({ error: "Project not found" })
		}

		const query = db()
			.collection("projects")
			.doc(id)
			.collection("signals")
			.orderBy("createdAt", "desc")
			.limit(200)

		const snap = await query.get()
		let items = snap.docs.map(d => ({ id: d.id, ...d.data() }))

		if (priority) items = items.filter(i => i.priority === priority)
		if (agent) items = items.filter(i => i.agent === agent)
		if (change_type)
			items = items.filter(i => i.change_type === change_type)

		const max = Math.min(Number(rawLimit) || 100, 200)
		items = items.slice(0, max)

		return res.json(items)
	} catch (err) {
		console.error("GET /projects/:id/signals", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

export default router

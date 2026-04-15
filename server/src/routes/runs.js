import { Router } from "express"
import { getFirestore } from "../db/firebase.js"

const router = Router()
const db = () => getFirestore()

router.get("/:id/runs", async (req, res) => {
	try {
		const { id } = req.params

		const projectSnap = await db().collection("projects").doc(id).get()
		if (!projectSnap.exists) {
			return res.status(404).json({ error: "Project not found" })
		}

		const snap = await db()
			.collection("projects")
			.doc(id)
			.collection("runs")
			.orderBy("createdAt", "desc")
			.limit(50)
			.get()

		const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
		return res.json(items)
	} catch (err) {
		console.error("GET /projects/:id/runs", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

export default router

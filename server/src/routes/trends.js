import { Router } from "express"
import { getFirestore } from "../db/firebase.js"

const router = Router()
const db = () => getFirestore()

router.get("/:id/trends", async (req, res) => {
	try {
		const { id } = req.params
		const { limit: rawLimit } = req.query

		const projectSnap = await db().collection("projects").doc(id).get()
		if (!projectSnap.exists) {
			return res.status(404).json({ error: "Project not found" })
		}

		const max = Math.min(Number(rawLimit) || 20, 50)

		const snap = await db()
			.collection("projects")
			.doc(id)
			.collection("trends")
			.orderBy("createdAt", "desc")
			.limit(max)
			.get()

		const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse()

		return res.json(items)
	} catch (err) {
		console.error("GET /projects/:id/trends", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

export default router

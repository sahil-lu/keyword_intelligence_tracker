import { Router } from "express"
import { getFirestore } from "../db/firebase.js"

const router = Router()
const db = () => getFirestore()

/**
 * Latest report for a project (GET /projects/:id/report when mounted at /projects).
 */
router.get("/:id/report", async (req, res) => {
	try {
		const projectId = req.params.id
		const projectSnap = await db()
			.collection("projects")
			.doc(projectId)
			.get()
		if (!projectSnap.exists) {
			return res.status(404).json({ error: "Project not found" })
		}

		const snap = await db()
			.collection("projects")
			.doc(projectId)
			.collection("reports")
			.orderBy("createdAt", "desc")
			.limit(1)
			.get()

		if (snap.empty) {
			return res.status(404).json({ error: "No reports yet" })
		}

		const doc = snap.docs[0]
		const data = doc.data()
		return res.json({
			id: doc.id,
			projectId,
			createdAt: data.createdAt,
			report: data.report,
			insights: data.insights,
		})
	} catch (err) {
		console.error("GET /projects/:id/report", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

export default router

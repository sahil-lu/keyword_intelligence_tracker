import { Router } from "express"
import { getFirestore } from "../db/firebase.js"

const router = Router()
const db = () => getFirestore()

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

		let insights = []
		if (data.runId) {
			const insightsSnap = await db()
				.collection("projects")
				.doc(projectId)
				.collection("insights")
				.where("runId", "==", data.runId)
				.limit(100)
				.get()
			insights = insightsSnap.docs
				.map(d => ({ id: d.id, ...d.data() }))
				.sort((a, b) => {
					const ta = a.createdAt?._seconds || 0
					const tb = b.createdAt?._seconds || 0
					return tb - ta
				})
		}

		return res.json({
			id: doc.id,
			projectId,
			runId: data.runId || null,
			createdAt: data.createdAt,
			report: data.report,
			insights,
		})
	} catch (err) {
		console.error("GET /projects/:id/report", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

export default router

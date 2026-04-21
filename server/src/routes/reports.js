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

		let signals = []
		if (data.runId) {
			const signalsSnap = await db()
				.collection("projects")
				.doc(projectId)
				.collection("signals")
				.where("runId", "==", data.runId)
				.limit(100)
				.get()
			signals = signalsSnap.docs
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
			signals,
		})
	} catch (err) {
		console.error("GET /projects/:id/report", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

export default router

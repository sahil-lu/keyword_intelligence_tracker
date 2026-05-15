import { Router } from "express"
import { FieldValue } from "firebase-admin/firestore"
import { getFirestore } from "../db/firebase.js"

const router = Router()
const db = () => getFirestore()

const STALE_RUN_MS = 30 * 60 * 1000

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

		for (const run of items) {
			if (run.status !== "running") continue
			const sec = run.startedAt?._seconds ?? run.startedAt?.seconds
			if (!sec) continue
			if (Date.now() - sec * 1000 > STALE_RUN_MS) {
				await db()
					.collection("projects")
					.doc(id)
					.collection("runs")
					.doc(run.id)
					.update({
						status: "failed",
						error: "Scan timed out",
						completedAt: FieldValue.serverTimestamp(),
					})
				run.status = "failed"
				run.error = "Scan timed out"
			}
		}

		return res.json(items)
	} catch (err) {
		console.error("GET /projects/:id/runs", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

router.get("/:id/runs/:runId/model-reports", async (req, res) => {
	try {
		const { id, runId } = req.params

		const projectSnap = await db().collection("projects").doc(id).get()
		if (!projectSnap.exists) {
			return res.status(404).json({ error: "Project not found" })
		}

		const runSnap = await db()
			.collection("projects")
			.doc(id)
			.collection("runs")
			.doc(runId)
			.get()

		if (!runSnap.exists) {
			return res.status(404).json({ error: "Run not found" })
		}

		const run = runSnap.data()
		return res.json(run.modelReports || {})
	} catch (err) {
		console.error("GET /projects/:id/runs/:runId/model-reports", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

export default router

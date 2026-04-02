import { Router } from "express"
import { FieldValue } from "firebase-admin/firestore"
import { getFirestore } from "../db/firebase.js"
import { runProject } from "../services/pipeline.js"

const router = Router()
const db = () => getFirestore()

function projectBody(req) {
	const { name, keyword, competitors, frequency } = req.body || {}
	return {
		name: String(name || "").trim(),
		keyword: String(keyword || "").trim(),
		competitors: Array.isArray(competitors) ? competitors.map(String) : [],
		frequency: frequency === "weekly" ? "weekly" : "daily",
	}
}

router.post("/", async (req, res) => {
	try {
		const body = projectBody(req)
		if (!body.name || !body.keyword) {
			return res
				.status(400)
				.json({ error: "name and keyword are required" })
		}

		const ref = await db()
			.collection("projects")
			.add({
				...body,
				createdAt: FieldValue.serverTimestamp(),
				updatedAt: FieldValue.serverTimestamp(),
			})

		const snap = await ref.get()
		return res.status(201).json({ id: ref.id, ...snap.data() })
	} catch (err) {
		console.error("POST /projects", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

router.get("/", async (_req, res) => {
	try {
		const snap = await db()
			.collection("projects")
			.orderBy("createdAt", "desc")
			.limit(100)
			.get()
		const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
		return res.json(items)
	} catch (err) {
		console.error("GET /projects", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

router.get("/:id", async (req, res) => {
	try {
		const snap = await db().collection("projects").doc(req.params.id).get()
		if (!snap.exists) {
			return res.status(404).json({ error: "Not found" })
		}
		return res.json({ id: snap.id, ...snap.data() })
	} catch (err) {
		console.error("GET /projects/:id", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

router.post("/:id/run", async (req, res) => {
	try {
		const snap = await db().collection("projects").doc(req.params.id).get()
		if (!snap.exists) {
			return res.status(404).json({ error: "Not found" })
		}

		const project = { id: snap.id, ...snap.data() }
		const result = await runProject(project)
		return res.json(result)
	} catch (err) {
		console.error("POST /projects/:id/run", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

export default router

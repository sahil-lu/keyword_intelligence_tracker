import { Router } from "express"
import { FieldValue } from "firebase-admin/firestore"
import { getFirestore } from "../db/firebase.js"
import { runProject } from "../services/pipeline.js"
import { sendEmailReport } from "../services/emailService.js"

const router = Router()
const db = () => getFirestore()

function projectBody(req) {
	const { name, keyword, competitors, competitorDomains, frequency } =
		req.body || {}
	return {
		name: String(name || "").trim(),
		keyword: String(keyword || "").trim(),
		competitors: Array.isArray(competitors) ? competitors.map(String) : [],
		competitorDomains: Array.isArray(competitorDomains)
			? competitorDomains.map(String)
			: [],
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
				customSources: [],
				emailRecipients: [],
				emailEnabled: false,
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

router.put("/:id", async (req, res) => {
	try {
		const ref = db().collection("projects").doc(req.params.id)
		const snap = await ref.get()
		if (!snap.exists) return res.status(404).json({ error: "Not found" })

		const updates = {}
		const allowed = [
			"name",
			"keyword",
			"competitors",
			"competitorDomains",
			"frequency",
		]
		for (const key of allowed) {
			if (req.body[key] !== undefined) {
				updates[key] = req.body[key]
			}
		}
		updates.updatedAt = FieldValue.serverTimestamp()

		await ref.update(updates)
		const updated = await ref.get()
		return res.json({ id: updated.id, ...updated.data() })
	} catch (err) {
		console.error("PUT /projects/:id", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

router.put("/:id/sources", async (req, res) => {
	try {
		const ref = db().collection("projects").doc(req.params.id)
		const snap = await ref.get()
		if (!snap.exists) return res.status(404).json({ error: "Not found" })

		const sources = Array.isArray(req.body.sources)
			? req.body.sources
					.filter(s => typeof s === "string" && s.trim())
					.map(s => s.trim())
			: []

		await ref.update({
			customSources: sources,
			updatedAt: FieldValue.serverTimestamp(),
		})

		return res.json({ customSources: sources })
	} catch (err) {
		console.error("PUT /projects/:id/sources", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

router.put("/:id/competitors", async (req, res) => {
	try {
		const ref = db().collection("projects").doc(req.params.id)
		const snap = await ref.get()
		if (!snap.exists) return res.status(404).json({ error: "Not found" })

		const updates = { updatedAt: FieldValue.serverTimestamp() }

		if (Array.isArray(req.body.competitors)) {
			updates.competitors = req.body.competitors.filter(
				s => typeof s === "string" && s.trim()
			)
		}
		if (Array.isArray(req.body.competitorDomains)) {
			updates.competitorDomains = req.body.competitorDomains.filter(
				s => typeof s === "string" && s.trim()
			)
		}

		await ref.update(updates)
		const updated = await ref.get()
		return res.json({ id: updated.id, ...updated.data() })
	} catch (err) {
		console.error("PUT /projects/:id/competitors", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

router.put("/:id/email-settings", async (req, res) => {
	try {
		const ref = db().collection("projects").doc(req.params.id)
		const snap = await ref.get()
		if (!snap.exists) return res.status(404).json({ error: "Not found" })

		const updates = { updatedAt: FieldValue.serverTimestamp() }

		if (typeof req.body.emailEnabled === "boolean") {
			updates.emailEnabled = req.body.emailEnabled
		}
		if (Array.isArray(req.body.emailRecipients)) {
			updates.emailRecipients = req.body.emailRecipients
				.filter(s => typeof s === "string" && s.includes("@"))
				.map(s => s.trim().toLowerCase())
		}

		await ref.update(updates)
		const updated = await ref.get()
		return res.json({ id: updated.id, ...updated.data() })
	} catch (err) {
		console.error("PUT /projects/:id/email-settings", err)
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

		if (project.emailEnabled && project.emailRecipients?.length > 0) {
			sendEmailReport(
				project,
				result.report,
				project.emailRecipients
			).catch(err => {
				console.error("Email send failed:", err.message)
			})
		}

		return res.json(result)
	} catch (err) {
		console.error("POST /projects/:id/run", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

export default router

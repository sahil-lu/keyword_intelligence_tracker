import { Router } from "express"
import { getFirestore } from "../db/firebase.js"
import {
	chat,
	getHistory,
	clearHistory,
	getSuggestions,
} from "../services/chatbotService.js"

const router = Router()
const db = () => getFirestore()

router.post("/:id/chat", async (req, res) => {
	try {
		const { id } = req.params
		const { message } = req.body || {}

		if (!message || typeof message !== "string" || !message.trim()) {
			return res.status(400).json({ error: "message is required" })
		}

		const projectSnap = await db().collection("projects").doc(id).get()
		if (!projectSnap.exists) {
			return res.status(404).json({ error: "Project not found" })
		}

		const result = await chat(id, message.trim())
		return res.json(result)
	} catch (err) {
		console.error("POST /projects/:id/chat", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

router.get("/:id/chat/history", async (req, res) => {
	try {
		const { id } = req.params
		const projectSnap = await db().collection("projects").doc(id).get()
		if (!projectSnap.exists) {
			return res.status(404).json({ error: "Project not found" })
		}

		const messages = await getHistory(id)
		return res.json(messages)
	} catch (err) {
		console.error("GET /projects/:id/chat/history", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

router.delete("/:id/chat/history", async (req, res) => {
	try {
		const { id } = req.params
		await clearHistory(id)
		return res.json({ ok: true })
	} catch (err) {
		console.error("DELETE /projects/:id/chat/history", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

router.get("/:id/chat/suggestions", async (req, res) => {
	try {
		const { id } = req.params
		const projectSnap = await db().collection("projects").doc(id).get()
		if (!projectSnap.exists) {
			return res.status(404).json({ error: "Project not found" })
		}

		const project = { id: projectSnap.id, ...projectSnap.data() }
		const suggestions = getSuggestions(project)
		return res.json(suggestions)
	} catch (err) {
		console.error("GET /projects/:id/chat/suggestions", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

export default router

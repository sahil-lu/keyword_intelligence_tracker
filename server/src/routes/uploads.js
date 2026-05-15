import { Router } from "express"
import { createRequire } from "node:module"
import multer from "multer"
import { FieldValue } from "firebase-admin/firestore"
import { getFirestore, getStorageBucket } from "../db/firebase.js"

const require = createRequire(import.meta.url)
const pdf = require("pdf-parse")

const router = Router()
const db = () => getFirestore()

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 20 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		const allowed = [
			"application/pdf",
			"text/plain",
			"text/markdown",
			"text/csv",
		]
		if (allowed.includes(file.mimetype)) {
			cb(null, true)
		} else {
			cb(new Error("Only PDF, TXT, MD, and CSV files are supported."))
		}
	},
})

async function extractTextFromFile(buffer, mimetype) {
	if (mimetype === "application/pdf") {
		const data = await pdf(buffer)
		return data.text || ""
	}
	return buffer.toString("utf-8")
}

router.get("/:id/uploads", async (req, res) => {
	try {
		const { id } = req.params
		const snap = await db()
			.collection("projects")
			.doc(id)
			.collection("uploads")
			.orderBy("uploadedAt", "desc")
			.limit(100)
			.get()

		const items = snap.docs.map(d => {
			const data = d.data()
			return {
				id: d.id,
				filename: data.filename,
				fileSize: data.fileSize,
				mimeType: data.mimeType,
				uploadedAt: data.uploadedAt,
				textLength: data.textLength || 0,
			}
		})
		return res.json(items)
	} catch (err) {
		console.error("GET /projects/:id/uploads", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

router.post("/:id/uploads", upload.single("file"), async (req, res) => {
	try {
		const { id } = req.params
		const projectSnap = await db().collection("projects").doc(id).get()
		if (!projectSnap.exists) {
			return res.status(404).json({ error: "Project not found" })
		}

		if (!req.file) {
			return res.status(400).json({ error: "No file provided" })
		}

		const { originalname, mimetype, size, buffer } = req.file
		const extractedText = await extractTextFromFile(buffer, mimetype)

		if (!extractedText || extractedText.trim().length < 10) {
			return res
				.status(422)
				.json({ error: "Could not extract meaningful text from file." })
		}

		let downloadUrl = null
		const bucket = getStorageBucket()
		if (bucket) {
			const storagePath = `projects/${id}/uploads/${Date.now()}_${originalname}`
			const file = bucket.file(storagePath)
			await file.save(buffer, { contentType: mimetype })
			await file.makePublic().catch(() => {})
			downloadUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`
		}

		const docRef = await db()
			.collection("projects")
			.doc(id)
			.collection("uploads")
			.add({
				filename: originalname,
				mimeType: mimetype,
				fileSize: size,
				extractedText,
				textLength: extractedText.length,
				downloadUrl,
				uploadedAt: FieldValue.serverTimestamp(),
			})

		return res.status(201).json({
			id: docRef.id,
			filename: originalname,
			fileSize: size,
			mimeType: mimetype,
			textLength: extractedText.length,
		})
	} catch (err) {
		console.error("POST /projects/:id/uploads", err)
		if (err instanceof multer.MulterError) {
			return res.status(400).json({ error: err.message })
		}
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

router.delete("/:id/uploads/:uploadId", async (req, res) => {
	try {
		const { id, uploadId } = req.params
		const ref = db()
			.collection("projects")
			.doc(id)
			.collection("uploads")
			.doc(uploadId)

		const snap = await ref.get()
		if (!snap.exists) {
			return res.status(404).json({ error: "Upload not found" })
		}

		const data = snap.data()
		if (data.downloadUrl) {
			try {
				const bucket = getStorageBucket()
				if (bucket) {
					const urlPath = data.downloadUrl.split(`${bucket.name}/`)[1]
					if (urlPath) await bucket.file(urlPath).delete()
				}
			} catch {
				/* storage cleanup is best-effort */
			}
		}

		await ref.delete()
		return res.json({ ok: true })
	} catch (err) {
		console.error("DELETE /projects/:id/uploads/:uploadId", err)
		return res.status(500).json({ error: err.message || "Server error" })
	}
})

export default router

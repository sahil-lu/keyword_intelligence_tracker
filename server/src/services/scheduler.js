import cron from "node-cron"
import { getFirestore } from "../db/firebase.js"
import { runProject } from "./pipeline.js"
import { sendEmailReport } from "./emailService.js"

function log(stage, data) {
	const ts = new Date().toISOString()
	console.log(JSON.stringify({ ts, stage, ...data }))
}

export function startScheduler() {
	const db = getFirestore()

	cron.schedule(
		"0 2 * * *",
		async () => {
			log("scheduler:tick", { type: "daily" })
			await runFrequency(db, "daily")
		},
		{ timezone: "Asia/Kolkata" }
	)

	cron.schedule(
		"0 2 * * 1",
		async () => {
			log("scheduler:tick", { type: "weekly" })
			await runFrequency(db, "weekly")
		},
		{ timezone: "Asia/Kolkata" }
	)

	log("scheduler:started", { daily: "08:00 IST", weekly: "Mon 08:00 IST" })
}

async function runFrequency(db, frequency) {
	const snap = await db
		.collection("projects")
		.where("frequency", "==", frequency)
		.get()

	log("scheduler:projects", { frequency, count: snap.docs.length })

	for (const doc of snap.docs) {
		const project = { id: doc.id, ...doc.data() }
		try {
			const result = await runProject(project)

			if (project.emailEnabled && project.emailRecipients?.length > 0) {
				await sendEmailReport(
					project,
					result.report,
					project.emailRecipients
				)
			}

			log("scheduler:run:ok", { projectId: doc.id })
		} catch (err) {
			log("scheduler:run:fail", { projectId: doc.id, error: err.message })
		}
	}
}

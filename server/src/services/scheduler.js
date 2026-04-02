import cron from "node-cron"
import { getFirestore } from "../db/firebase.js"
import { runProject } from "./pipeline.js"

/**
 * Schedules periodic runs: daily projects at 09:00 UTC, weekly on Mondays 09:00 UTC.
 */
export function startScheduler() {
	const db = getFirestore()

	cron.schedule(
		"0 9 * * *",
		async () => {
			console.log("[scheduler] daily tick")
			await runFrequency(db, "daily")
		},
		{ timezone: "UTC" }
	)

	cron.schedule(
		"0 9 * * 1",
		async () => {
			console.log("[scheduler] weekly tick")
			await runFrequency(db, "weekly")
		},
		{ timezone: "UTC" }
	)

	console.log("[scheduler] started (daily 09:00 UTC, weekly Mon 09:00 UTC)")
}

async function runFrequency(db, frequency) {
	const snap = await db
		.collection("projects")
		.where("frequency", "==", frequency)
		.get()
	for (const doc of snap.docs) {
		const project = { id: doc.id, ...doc.data() }
		try {
			await runProject(project)
		} catch (err) {
			console.error(
				`[scheduler] run failed project=${doc.id}`,
				err.message
			)
		}
	}
}

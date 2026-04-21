import { createHash } from "node:crypto"
import { FieldValue } from "firebase-admin/firestore"
import { getFirestore } from "../db/firebase.js"
import { generateQueries } from "../modules/queryGenerator.js"
import { fetchResults } from "../modules/fetcher.js"
import { extractContent } from "../modules/extractor.js"
import { deduplicate } from "../modules/deduplicator.js"
import { detectChanges } from "../modules/changeDetector.js"
import { analyzeContent } from "../modules/aiAnalyzer.js"
import { scoreSignal } from "../modules/scorer.js"
import { validateSignal } from "../modules/signalValidator.js"
import { generateReport } from "../modules/reportGenerator.js"

const CONCURRENCY = 3

function contentHash(text) {
	return createHash("sha256")
		.update(text || "")
		.digest("hex")
		.slice(0, 16)
}

function urlToDocId(url) {
	return createHash("md5").update(url).digest("hex")
}

export async function runProject(project) {
	if (!project?.id) throw new Error("runProject requires project.id")

	const db = getFirestore()
	const projectRef = db.collection("projects").doc(project.id)
	const startTime = Date.now()

	const runRef = await projectRef.collection("runs").add({
		status: "running",
		startedAt: FieldValue.serverTimestamp(),
		createdAt: FieldValue.serverTimestamp(),
	})

	console.log(
		`[pipeline] start project=${project.id} keyword=${project.keyword} run=${runRef.id}`
	)

	try {
		const queries = generateQueries(project)
		console.log(`[pipeline] ${queries.length} queries`)

		let fetched = await fetchResults(queries)
		fetched = deduplicate(fetched)
		console.log(`[pipeline] ${fetched.length} unique URLs`)

		const extracted = await mapPool(fetched, CONCURRENCY, async item => {
			const { url, text } = await extractContent(item.url)
			return { url, title: item.title, text, hash: contentHash(text) }
		})

		const docsSnap = await projectRef.collection("documents").get()
		const existingDocs = {}
		docsSnap.forEach(d => {
			const data = d.data()
			existingDocs[data.url] = data
		})

		const withChanges = detectChanges(extracted, existingDocs)

		const signals = []
		let discardedCount = 0

		for (const row of withChanges) {
			const analysis = await analyzeContent(row.text, {
				keyword: project.keyword,
				competitors: project.competitors || [],
			})

			const validation = validateSignal(analysis)
			if (!validation.valid) {
				discardedCount++
				console.log(
					`[pipeline] discarded signal: ${validation.reason} — url=${row.url}`
				)
				continue
			}

			const priority = scoreSignal(
				analysis,
				project.competitors || [],
				row.change_type
			)

			signals.push({
				url: row.url,
				title: analysis.title || row.title,
				agent: analysis.agent,
				what_changed: analysis.what_changed,
				impact_on_itm: analysis.impact_on_itm,
				recommended_action: analysis.recommended_action,
				change_type: row.change_type,
				priority,
				contentHash: row.hash,
				runId: runRef.id,
			})
		}

		console.log(
			`[pipeline] ${signals.length} valid signals, ${discardedCount} discarded`
		)

		const now = new Date().toISOString()

		const signalBatch = db.batch()
		for (const signal of signals) {
			const ref = projectRef.collection("signals").doc()
			signalBatch.set(ref, {
				...signal,
				createdAt: FieldValue.serverTimestamp(),
			})
		}
		await signalBatch.commit()

		const docBatch = db.batch()
		for (const row of extracted) {
			const docId = urlToDocId(row.url)
			const docRef = projectRef.collection("documents").doc(docId)
			if (existingDocs[row.url]) {
				docBatch.update(docRef, {
					lastSeenAt: FieldValue.serverTimestamp(),
					contentHash: row.hash,
					title: row.title,
					seenInRuns: FieldValue.arrayUnion(runRef.id),
				})
			} else {
				docBatch.set(docRef, {
					url: row.url,
					title: row.title,
					firstSeenAt: FieldValue.serverTimestamp(),
					lastSeenAt: FieldValue.serverTimestamp(),
					contentHash: row.hash,
					seenInRuns: [runRef.id],
				})
			}
		}
		await docBatch.commit()

		const report = generateReport(signals, project, discardedCount)

		const reportRef = await projectRef.collection("reports").add({
			runId: runRef.id,
			createdAt: FieldValue.serverTimestamp(),
			report,
		})

		const duration = Date.now() - startTime
		const stats = report.stats

		await runRef.update({
			status: "completed",
			completedAt: FieldValue.serverTimestamp(),
			totalItems: stats.total,
			newItems: stats.new,
			highPriorityCount: stats.high,
			mediumPriorityCount: stats.medium,
			lowPriorityCount: stats.low,
			discardedCount,
			duration,
			reportId: reportRef.id,
		})

		await projectRef.update({
			updatedAt: FieldValue.serverTimestamp(),
			lastRunAt: FieldValue.serverTimestamp(),
			lastReportId: reportRef.id,
		})

		console.log(
			`[pipeline] done report=${reportRef.id} signals=${stats.total} discarded=${discardedCount} duration=${duration}ms`
		)

		return {
			reportId: reportRef.id,
			runId: runRef.id,
			report,
			signals: signals.map(s => ({ ...s, createdAt: now })),
		}
	} catch (err) {
		await runRef.update({
			status: "failed",
			completedAt: FieldValue.serverTimestamp(),
			error: err.message,
			duration: Date.now() - startTime,
		})
		throw err
	}
}

async function mapPool(items, concurrency, fn) {
	const out = new Array(items.length)
	let i = 0
	async function worker() {
		while (i < items.length) {
			const idx = i++
			out[idx] = await fn(items[idx], idx)
		}
	}
	const workers = Array.from(
		{ length: Math.min(concurrency, items.length) },
		() => worker()
	)
	await Promise.all(workers)
	return out
}

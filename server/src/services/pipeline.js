import { FieldValue } from "firebase-admin/firestore"
import { getFirestore } from "../db/firebase.js"
import { generateQueries } from "../modules/queryGenerator.js"
import { fetchResults } from "../modules/fetcher.js"
import { extractContent } from "../modules/extractor.js"
import { deduplicate } from "../modules/deduplicator.js"
import { detectChanges } from "../modules/changeDetector.js"
import { analyzeContent } from "../modules/aiAnalyzer.js"
import { scoreInsight } from "../modules/scorer.js"
import { generateReport } from "../modules/reportGenerator.js"

const CONCURRENCY = 3

/**
 * End-to-end run: search → extract → dedupe → change tags → AI → score → report → Firestore.
 */
export async function runProject(project) {
	if (!project?.id) {
		throw new Error("runProject requires project.id")
	}

	const db = getFirestore()
	const projectRef = db.collection("projects").doc(project.id)

	console.log(
		`[runProject] start project=${project.id} keyword=${project.keyword}`
	)

	const queries = generateQueries(project)
	console.log(`[runProject] generated ${queries.length} queries`)

	let fetched = await fetchResults(queries)
	console.log(`[runProject] fetched ${fetched.length} raw results`)

	fetched = deduplicate(fetched)
	console.log(`[runProject] after dedupe ${fetched.length} URLs`)

	const extracted = await mapPool(fetched, CONCURRENCY, async item => {
		const { url, text } = await extractContent(item.url)
		return { url, title: item.title, text }
	})

	const lastSnap = await projectRef
		.collection("reports")
		.orderBy("createdAt", "desc")
		.limit(1)
		.get()
	let existingItems = []
	if (!lastSnap.empty) {
		existingItems = lastSnap.docs[0].data().itemsSnapshot || []
	}

	const itemsForChange = extracted.map(({ url, title }) => ({ url, title }))
	const withChanges = detectChanges(itemsForChange, existingItems)
	const urlToChange = Object.fromEntries(
		withChanges.map(x => [x.url, x.changeType])
	)

	const insights = []
	for (const row of extracted) {
		const changeType = urlToChange[row.url] || "new"
		const analysis = await analyzeContent(row.text, {
			keyword: project.keyword,
			competitors: project.competitors || [],
		})
		const score = scoreInsight(analysis, project.competitors || [])
		insights.push({
			url: row.url,
			title: row.title,
			changeType,
			summary: analysis.summary,
			category: analysis.category,
			why_it_matters: analysis.why_it_matters,
			suggested_action: analysis.suggested_action,
			score,
		})
	}

	const report = generateReport(insights)

	const payload = {
		createdAt: FieldValue.serverTimestamp(),
		report,
		itemsSnapshot: itemsForChange,
		insights,
	}

	const docRef = await projectRef.collection("reports").add(payload)
	await projectRef.update({
		updatedAt: FieldValue.serverTimestamp(),
		lastRunAt: FieldValue.serverTimestamp(),
		lastReportId: docRef.id,
	})

	console.log(`[runProject] saved report=${docRef.id}`)

	return {
		reportId: docRef.id,
		report,
		insights,
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

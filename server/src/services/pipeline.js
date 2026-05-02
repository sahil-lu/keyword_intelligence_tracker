import { createHash } from "node:crypto"
import { FieldValue } from "firebase-admin/firestore"
import { getFirestore } from "../db/firebase.js"
import { generateQueries } from "../modules/queryGenerator.js"
import { fetchResults, fetchDirectUrls } from "../modules/fetcher.js"
import { extractContent } from "../modules/extractor.js"
import { deduplicate } from "../modules/deduplicator.js"
import { detectChanges } from "../modules/changeDetector.js"
import { analyzeContent } from "../modules/aiAnalyzer.js"
import { scoreSignal } from "../modules/scorer.js"
import {
	validateSignal,
	deduplicateSignals,
} from "../modules/signalValidator.js"
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

function log(stage, data) {
	const ts = new Date().toISOString()
	console.log(JSON.stringify({ ts, stage, ...data }))
}

async function getPreviousTrend(projectRef) {
	try {
		const snap = await projectRef
			.collection("trends")
			.orderBy("createdAt", "desc")
			.limit(1)
			.get()
		if (snap.empty) return null
		return snap.docs[0].data()
	} catch {
		return null
	}
}

export async function runProject(project) {
	if (!project?.id) throw new Error("runProject requires project.id")

	const db = getFirestore()
	const projectRef = db.collection("projects").doc(project.id)
	const startTime = Date.now()
	const pipelineLog = {
		fetchErrors: 0,
		extractErrors: 0,
		aiErrors: 0,
		tavilyResults: 0,
		exaResults: 0,
		customSourcesCount: 0,
		competitorUrlsCount: 0,
		firecrawlOk: 0,
		firecrawlFail: 0,
	}

	const runRef = await projectRef.collection("runs").add({
		status: "running",
		startedAt: FieldValue.serverTimestamp(),
		createdAt: FieldValue.serverTimestamp(),
	})

	log("pipeline:start", {
		projectId: project.id,
		keyword: project.keyword,
		runId: runRef.id,
	})

	try {
		const queries = generateQueries(project)
		log("pipeline:queries", { count: queries.length })

		let fetched
		try {
			fetched = await fetchResults(queries)
			pipelineLog.tavilyResults = fetched.filter(
				f => f.source_type === "search"
			).length
		} catch (err) {
			pipelineLog.fetchErrors++
			log("pipeline:fetch:error", { error: err.message })
			fetched = []
		}

		const customSources = Array.isArray(project.customSources)
			? project.customSources
			: []
		if (customSources.length > 0) {
			const customItems = await fetchDirectUrls(customSources)
			const tagged = customItems.map(c => ({
				...c,
				source_type: "custom",
			}))
			fetched.push(...tagged)
			pipelineLog.customSourcesCount = tagged.length
			log("pipeline:custom-sources", { count: tagged.length })
		}

		const competitorDomains = Array.isArray(project.competitorDomains)
			? project.competitorDomains
			: []
		const competitors = Array.isArray(project.competitors)
			? project.competitors
			: []
		if (competitorDomains.length > 0) {
			const domainItems = await fetchDirectUrls(competitorDomains)
			const tagged = domainItems.map(c => ({
				...c,
				source_type: "competitor",
			}))
			fetched.push(...tagged)
			pipelineLog.competitorUrlsCount = tagged.length
			log("pipeline:competitor-domains", { count: tagged.length })
		}

		fetched = deduplicate(fetched)
		log("pipeline:urls", { unique: fetched.length })

		const extracted = await mapPool(fetched, CONCURRENCY, async item => {
			try {
				const { url, text } = await extractContent(item.url)
				return {
					url,
					title: item.title,
					text,
					hash: contentHash(text),
					source_type: item.source_type || "search",
					entity: item.entity || null,
				}
			} catch (err) {
				pipelineLog.extractErrors++
				log("pipeline:extract:error", {
					url: item.url,
					error: err.message,
				})
				return {
					url: item.url,
					title: item.title,
					text: "",
					hash: "",
					source_type: item.source_type || "search",
					entity: item.entity || null,
				}
			}
		})

		const validExtracted = extracted.filter(e => e.text.length > 50)

		const docsSnap = await projectRef.collection("documents").get()
		const existingDocs = {}
		docsSnap.forEach(d => {
			const data = d.data()
			existingDocs[data.url] = data
		})

		const withChanges = detectChanges(validExtracted, existingDocs)

		let signals = []
		let discardedCount = 0
		const discardReasons = {}

		for (const row of withChanges) {
			let analysis
			try {
				analysis = await analyzeContent(row.text, {
					keyword: project.keyword,
					competitors: competitors,
				})
			} catch (err) {
				pipelineLog.aiErrors++
				log("pipeline:ai:error", { url: row.url, error: err.message })
				continue
			}

			const validation = validateSignal(analysis)
			if (!validation.valid) {
				discardedCount++
				const bucket = validation.reason.split(":")[0] || "unknown"
				discardReasons[bucket] = (discardReasons[bucket] || 0) + 1
				log("pipeline:discard", {
					reason: validation.reason,
					url: row.url,
				})
				continue
			}

			const { priority, priority_score } = scoreSignal(
				analysis,
				competitors,
				row.change_type
			)

			const entity =
				row.entity ||
				detectEntity(row.url, competitors, competitorDomains)

			signals.push({
				url: row.url,
				title: analysis.title || row.title,
				agent: analysis.agent,
				what_changed: analysis.what_changed,
				impact_on_itm: analysis.impact_on_itm,
				recommended_action: analysis.recommended_action,
				change_type: row.change_type,
				priority,
				priority_score,
				confidence_score: analysis.confidence_score,
				source_type: row.source_type || "search",
				entity,
				contentHash: row.hash,
				runId: runRef.id,
			})
		}

		const preDedup = signals.length
		signals = deduplicateSignals(signals)
		const dedupRemoved = preDedup - signals.length
		if (dedupRemoved > 0) {
			discardedCount += dedupRemoved
			log("pipeline:dedup", { removed: dedupRemoved })
		}

		log("pipeline:signals", {
			valid: signals.length,
			discarded: discardedCount,
			discardReasons,
		})

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
					source_type: row.source_type || "search",
					seenInRuns: FieldValue.arrayUnion(runRef.id),
				})
			} else {
				docBatch.set(docRef, {
					url: row.url,
					title: row.title,
					source_type: row.source_type || "search",
					firstSeenAt: FieldValue.serverTimestamp(),
					lastSeenAt: FieldValue.serverTimestamp(),
					contentHash: row.hash,
					seenInRuns: [runRef.id],
				})
			}
		}
		await docBatch.commit()

		const previousTrend = await getPreviousTrend(projectRef)

		const report = generateReport(
			signals,
			project,
			discardedCount,
			previousTrend
		)

		const reportRef = await projectRef.collection("reports").add({
			runId: runRef.id,
			createdAt: FieldValue.serverTimestamp(),
			report,
		})

		const agentDist = {}
		const priorityDist = { HIGH: 0, MEDIUM: 0, LOW: 0 }
		for (const s of signals) {
			agentDist[s.agent] = (agentDist[s.agent] || 0) + 1
			priorityDist[s.priority] = (priorityDist[s.priority] || 0) + 1
		}

		await projectRef.collection("trends").add({
			runId: runRef.id,
			createdAt: FieldValue.serverTimestamp(),
			total: signals.length,
			high: priorityDist.HIGH,
			medium: priorityDist.MEDIUM,
			low: priorityDist.LOW,
			discarded: discardedCount,
			agents: agentDist,
			avg_confidence: report.stats.avg_confidence,
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
			dedupRemoved,
			avgConfidence: stats.avg_confidence,
			fetchErrors: pipelineLog.fetchErrors,
			extractErrors: pipelineLog.extractErrors,
			aiErrors: pipelineLog.aiErrors,
			customSourcesCount: pipelineLog.customSourcesCount,
			competitorUrlsCount: pipelineLog.competitorUrlsCount,
			duration,
			reportId: reportRef.id,
		})

		await projectRef.update({
			updatedAt: FieldValue.serverTimestamp(),
			lastRunAt: FieldValue.serverTimestamp(),
			lastReportId: reportRef.id,
		})

		log("pipeline:done", {
			reportId: reportRef.id,
			signals: stats.total,
			discarded: discardedCount,
			duration,
			avgConfidence: stats.avg_confidence,
			customSources: pipelineLog.customSourcesCount,
			competitorUrls: pipelineLog.competitorUrlsCount,
		})

		return {
			reportId: reportRef.id,
			runId: runRef.id,
			report,
			signals: signals.map(s => ({ ...s, createdAt: now })),
		}
	} catch (err) {
		log("pipeline:failed", {
			error: err.message,
			duration: Date.now() - startTime,
		})
		await runRef.update({
			status: "failed",
			completedAt: FieldValue.serverTimestamp(),
			error: err.message,
			duration: Date.now() - startTime,
			fetchErrors: pipelineLog.fetchErrors,
			extractErrors: pipelineLog.extractErrors,
			aiErrors: pipelineLog.aiErrors,
		})
		throw err
	}
}

function detectEntity(url, competitors, competitorDomains) {
	const lower = url.toLowerCase()
	for (let i = 0; i < competitorDomains.length; i++) {
		if (lower.includes(competitorDomains[i]?.toLowerCase())) {
			return competitors[i] || competitorDomains[i]
		}
	}
	for (const c of competitors) {
		if (lower.includes(c.toLowerCase().replace(/\s+/g, ""))) return c
	}
	return null
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

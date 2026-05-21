import OpenAI from "openai"
import { getFirestore } from "../db/firebase.js"

const client = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const db = () => getFirestore()

const MAX_CONTEXT_SIGNALS = 25
const MAX_HISTORY_MESSAGES = 12
const MAX_TREND_POINTS = 5

const SYSTEM_PROMPT = `You are the ITM Decision Intelligence Engine — a sharp, conversational AI analyst embedded in a project dashboard.

Response style:
- Talk like a smart colleague in a chat — short, direct, natural.
- Default to 1–3 sentences. Use bullet points ONLY when listing 3+ items.
- Do NOT write long paragraphs, headers, or essay-style answers by default.
- Elaborate ONLY when the user explicitly asks (e.g. "explain more", "go deeper", "elaborate").
- If the user asks a simple question, give a simple answer.

Rules:
- Use ONLY the project data in context below — never fabricate.
- If data is unavailable, say so briefly.
- Use **bold** sparingly for key terms.
- Be actionable — if there's something to do, say it in one line.`

async function getProjectContext(projectId) {
	const projectRef = db().collection("projects").doc(projectId)
	const projectSnap = await projectRef.get()
	if (!projectSnap.exists) return null

	const project = { id: projectSnap.id, ...projectSnap.data() }

	const [reportSnap, signalsSnap, trendsSnap] = await Promise.all([
		projectRef
			.collection("reports")
			.orderBy("createdAt", "desc")
			.limit(1)
			.get(),
		projectRef
			.collection("signals")
			.orderBy("createdAt", "desc")
			.limit(MAX_CONTEXT_SIGNALS)
			.get(),
		projectRef
			.collection("trends")
			.orderBy("createdAt", "desc")
			.limit(MAX_TREND_POINTS)
			.get(),
	])

	const report = reportSnap.empty ? null : reportSnap.docs[0].data()?.report
	const signals = signalsSnap.docs.map(d => {
		const s = d.data()
		return {
			title: s.title,
			agent: s.agent,
			priority: s.priority,
			what_changed: s.what_changed,
			impact_on_itm: s.impact_on_itm,
			recommended_action: s.recommended_action,
			confidence_score: s.confidence_score,
			url: s.url,
		}
	})
	const trends = trendsSnap.docs
		.map(d => {
			const t = d.data()
			return {
				total: t.total,
				high: t.high,
				medium: t.medium,
				low: t.low,
				agents: t.agents,
			}
		})
		.reverse()

	return { project, report, signals, trends }
}

function buildContextBlock(ctx) {
	if (!ctx) return "No project data available."

	const parts = []

	parts.push(
		`## Project\nName: ${ctx.project.name}\nKeywords: ${(ctx.project.keywords || [ctx.project.keyword]).filter(Boolean).join(", ")}\nCompetitors: ${(ctx.project.competitors || []).join(", ") || "None listed"}`
	)

	if (ctx.report) {
		parts.push(
			`## Latest Report\nExecutive Summary: ${ctx.report.executive_summary || "N/A"}`
		)
		if (ctx.report.recommendations?.length) {
			const recs = ctx.report.recommendations
				.slice(0, 5)
				.map(
					r =>
						`- [${r.priority}] ${r.action}${r.context ? ` (${r.context})` : ""}`
				)
				.join("\n")
			parts.push(`## Top Recommendations\n${recs}`)
		}
		if (ctx.report.stats) {
			const s = ctx.report.stats
			parts.push(
				`## Stats\nTotal signals: ${s.total}, High: ${s.high}, Medium: ${s.medium}, Low: ${s.low}, Avg confidence: ${s.avg_confidence}`
			)
		}
	}

	if (ctx.signals.length) {
		const byPriority = { HIGH: [], MEDIUM: [], LOW: [] }
		for (const s of ctx.signals) {
			;(byPriority[s.priority] || byPriority.MEDIUM).push(s)
		}
		const sigLines = []
		for (const [prio, items] of Object.entries(byPriority)) {
			for (const s of items.slice(0, 8)) {
				sigLines.push(
					`- [${prio}][${s.agent}] ${s.title}: ${s.what_changed}${s.recommended_action ? ` → Action: ${s.recommended_action}` : ""}`
				)
			}
		}
		parts.push(
			`## Recent Signals (${ctx.signals.length})\n${sigLines.join("\n")}`
		)
	}

	if (ctx.trends.length > 1) {
		const latest = ctx.trends[ctx.trends.length - 1]
		const prev = ctx.trends[ctx.trends.length - 2]
		const diff = latest.total - prev.total
		const highDiff = latest.high - prev.high
		parts.push(
			`## Trend\nLatest run: ${latest.total} signals (${latest.high} high). Change: ${diff >= 0 ? "+" : ""}${diff} total, ${highDiff >= 0 ? "+" : ""}${highDiff} high vs previous.`
		)
	}

	return parts.join("\n\n")
}

async function getChatHistory(projectId) {
	const snap = await db()
		.collection("projects")
		.doc(projectId)
		.collection("chats")
		.orderBy("createdAt", "asc")
		.limitToLast(MAX_HISTORY_MESSAGES)
		.get()

	return snap.docs.map(d => {
		const data = d.data()
		return { role: data.role, content: data.content }
	})
}

async function saveChatMessage(projectId, role, content) {
	const { FieldValue } = await import("firebase-admin/firestore")
	await db().collection("projects").doc(projectId).collection("chats").add({
		role,
		content,
		createdAt: FieldValue.serverTimestamp(),
	})
}

export async function chat(projectId, userMessage) {
	const [ctx, history] = await Promise.all([
		getProjectContext(projectId),
		getChatHistory(projectId),
	])

	if (!ctx) throw new Error("Project not found")

	const contextBlock = buildContextBlock(ctx)

	const messages = [
		{
			role: "system",
			content: `${SYSTEM_PROMPT}\n\n---\n\n${contextBlock}`,
		},
		...history,
		{ role: "user", content: userMessage },
	]

	const completion = await client().chat.completions.create({
		model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
		messages,
		temperature: 0.4,
		max_tokens: 400,
	})

	const assistantContent =
		completion.choices[0]?.message?.content ||
		"I couldn't generate a response."

	await saveChatMessage(projectId, "user", userMessage)
	await saveChatMessage(projectId, "assistant", assistantContent)

	const relatedSignals = (ctx.signals || [])
		.filter(s => {
			const lower = userMessage.toLowerCase()
			return (
				s.title?.toLowerCase().includes(lower.split(" ")[0]) ||
				s.agent?.toLowerCase().includes(lower.split(" ")[0]) ||
				s.priority === "HIGH"
			)
		})
		.slice(0, 3)

	return {
		response: assistantContent,
		relatedSignals,
	}
}

export async function getHistory(projectId) {
	const snap = await db()
		.collection("projects")
		.doc(projectId)
		.collection("chats")
		.orderBy("createdAt", "asc")
		.limitToLast(50)
		.get()

	return snap.docs.map(d => {
		const data = d.data()
		return {
			id: d.id,
			role: data.role,
			content: data.content,
			createdAt: data.createdAt,
		}
	})
}

export async function clearHistory(projectId) {
	const snap = await db()
		.collection("projects")
		.doc(projectId)
		.collection("chats")
		.limit(500)
		.get()

	if (snap.empty) return
	const batch = db().batch()
	for (const doc of snap.docs) batch.delete(doc.ref)
	await batch.commit()
}

export function getSuggestions(project) {
	const name = project?.name || "this project"
	const competitors = (project?.competitors || []).slice(0, 2).join(" and ")

	const base = [
		"What are the top actions this week?",
		"Summarize the latest findings",
		"Which signals are highest priority?",
		"What changed recently?",
		`What should ${name} focus on?`,
	]

	if (competitors) {
		base.push(`Summarize ${competitors} competitor activity`)
	} else {
		base.push("Which agent category is most active?")
	}

	return base
}

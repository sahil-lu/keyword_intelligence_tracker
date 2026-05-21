import { radarApi } from "@/lib/radar-api"
import { toast } from "sonner"
import { create } from "zustand"

const SIGNAL_AGENT_VIEWS = ["jobs", "skills", "policy", "program", "competitor"]
const SCAN_POLL_MS = 5000

export const useRadarStore = create((set, get) => ({
	projects: [],
	selectedProjectId: null,
	projectsLoading: true,

	activeView: "report",

	report: null,
	reportLoading: false,
	modelReports: {},
	modelReportsLoading: false,

	signals: [],
	signalsLoading: false,
	signalsFilter: {},
	hideLow: true,

	runs: [],
	runsLoading: false,

	documents: [],
	documentsLoading: false,

	trends: [],
	trendsLoading: false,

	scanning: false,
	scanningRunId: null,
	_scanPollTimer: null,

	setActiveView: view => {
		set({ activeView: view })
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		if (view === "report") get().fetchReport()
		if (view === "model-analysis") get().fetchModelReports()
		if (view === "signals") get().fetchSignals()
		if (SIGNAL_AGENT_VIEWS.includes(view)) {
			const { signalsFilter } = get()
			get().fetchSignals({ ...signalsFilter, agent: view })
		}
		if (view === "runs") get().fetchRuns()
		if (view === "documents") get().fetchDocuments()
	},

	syncFromUrl: (projectId, view) => {
		const { selectedProjectId, activeView } = get()
		const targetView = view || "report"

		const projectChanged = projectId && projectId !== selectedProjectId
		const viewChanged = targetView !== activeView

		if (!projectChanged && !viewChanged) return

		if (projectChanged) {
			get()._stopScanPolling()
			set({
				selectedProjectId: projectId,
				activeView: targetView,
				report: null,
				modelReports: {},
				signals: [],
				runs: [],
				documents: [],
				trends: [],
				scanning: false,
				scanningRunId: null,
			})
		} else {
			set({ activeView: targetView })
		}

		if (targetView === "report") get().fetchReport()
		if (targetView === "model-analysis") get().fetchModelReports()
		if (targetView === "signals") get().fetchSignals()
		if (SIGNAL_AGENT_VIEWS.includes(targetView))
			get().fetchSignals({ agent: targetView })
		if (targetView === "runs") get().fetchRuns()
		if (targetView === "documents") get().fetchDocuments()

		if (projectChanged) get()._checkForRunningScans()
	},

	fetchProjects: async () => {
		set({ projectsLoading: true })
		try {
			const projects = await radarApi.getProjects()
			const { selectedProjectId } = get()
			set({
				projects,
				projectsLoading: false,
				selectedProjectId: selectedProjectId || projects[0]?.id || null,
			})
		} catch (e) {
			toast.error(e.message)
			set({ projectsLoading: false })
		}
	},

	selectProject: id => {
		get()._stopScanPolling()
		set({
			selectedProjectId: id,
			report: null,
			modelReports: {},
			signals: [],
			runs: [],
			documents: [],
			trends: [],
			scanning: false,
			scanningRunId: null,
		})
		const { activeView } = get()
		if (activeView === "report") get().fetchReport()
		else if (activeView === "model-analysis") get().fetchModelReports()
		else if (activeView === "signals") get().fetchSignals()
		else if (SIGNAL_AGENT_VIEWS.includes(activeView))
			get().fetchSignals({ agent: activeView })
		else if (activeView === "runs") get().fetchRuns()
		else if (activeView === "documents") get().fetchDocuments()

		get()._checkForRunningScans()
	},

	createProject: async data => {
		const created = await radarApi.createProject(data)
		await get().fetchProjects()
		set({ selectedProjectId: created.id })
		return created
	},

	runScan: async () => {
		const { selectedProjectId } = get()
		if (!selectedProjectId || get().scanning) return
		set({ scanning: true })
		try {
			const result = await radarApi.runScan(selectedProjectId)
			set({ scanningRunId: result.runId })
			get()._startScanPolling()
			return result
		} catch (e) {
			toast.error(e.message)
			set({ scanning: false, scanningRunId: null })
			throw e
		}
	},

	_startScanPolling: () => {
		const existing = get()._scanPollTimer
		if (existing) clearInterval(existing)

		const timer = setInterval(async () => {
			const { selectedProjectId } = get()
			if (!selectedProjectId) {
				get()._stopScanPolling()
				return
			}
			try {
				const runs = await radarApi.getRuns(selectedProjectId)
				set({ runs })
				const hasRunning = runs.some(r => r.status === "running")
				if (!hasRunning) {
					get()._stopScanPolling()
					set({ scanning: false, scanningRunId: null })
					toast.success("Scan completed")
					get().fetchReport()
					get().fetchModelReports()
					get().fetchProjects()
				}
			} catch {
				/* ignore polling errors */
			}
		}, SCAN_POLL_MS)

		set({ _scanPollTimer: timer })
	},

	_stopScanPolling: () => {
		const timer = get()._scanPollTimer
		if (timer) {
			clearInterval(timer)
			set({ _scanPollTimer: null })
		}
	},

	_checkForRunningScans: async () => {
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		try {
			const runs = await radarApi.getRuns(selectedProjectId)
			set({ runs })
			const running = runs.find(r => r.status === "running")
			if (running && !get().scanning) {
				set({ scanning: true, scanningRunId: running.id })
				get()._startScanPolling()
			}
		} catch {
			/* ignore */
		}
	},

	fetchModelReports: async () => {
		const { selectedProjectId, report } = get()
		if (!selectedProjectId) return
		set({ modelReportsLoading: true })
		try {
			let currentReport = report
			if (!currentReport?.runId) {
				currentReport = await radarApi
					.getReport(selectedProjectId)
					.catch(() => null)
			}
			if (!currentReport?.runId) {
				set({ modelReports: {}, modelReportsLoading: false })
				return
			}
			const data = await radarApi.getModelReports(
				selectedProjectId,
				currentReport.runId
			)
			set({
				report: currentReport,
				modelReports: data || {},
				modelReportsLoading: false,
			})
		} catch (e) {
			toast.error(e.message)
			set({ modelReports: {}, modelReportsLoading: false })
		}
	},

	fetchReport: async () => {
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		set({ reportLoading: true })
		try {
			const [data, trends] = await Promise.all([
				radarApi.getReport(selectedProjectId),
				radarApi.getTrends(selectedProjectId).catch(() => []),
			])
			set({ report: data, trends, reportLoading: false })
		} catch (e) {
			if (
				e.message?.includes("No reports") ||
				e.message?.includes("404")
			) {
				set({ report: null, reportLoading: false })
			} else {
				toast.error(e.message)
				set({ reportLoading: false })
			}
		}
	},

	fetchSignals: async filters => {
		const { selectedProjectId, signalsFilter } = get()
		if (!selectedProjectId) return
		const f = filters || signalsFilter
		set({ signalsLoading: true, signalsFilter: f })
		try {
			const data = await radarApi.getSignals(selectedProjectId, f)
			set({ signals: data, signalsLoading: false })
		} catch {
			set({ signals: [], signalsLoading: false })
		}
	},

	navigateToSignals: (filter = {}) => {
		const activeView = SIGNAL_AGENT_VIEWS.includes(filter.agent)
			? filter.agent
			: "signals"
		set({ signalsFilter: filter, activeView })
		get().fetchSignals(filter)
	},

	setSignalsFilter: filter => {
		const current = get().signalsFilter
		const next = { ...current, ...filter }
		Object.keys(next).forEach(k => {
			if (!next[k]) delete next[k]
		})
		set({ signalsFilter: next })
		get().fetchSignals(next)
	},

	toggleHideLow: () => {
		set(state => ({ hideLow: !state.hideLow }))
	},

	fetchRuns: async () => {
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		set({ runsLoading: true })
		try {
			const data = await radarApi.getRuns(selectedProjectId)
			set({ runs: data, runsLoading: false })
		} catch {
			set({ runs: [], runsLoading: false })
		}
	},

	fetchDocuments: async () => {
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		set({ documentsLoading: true })
		try {
			const data = await radarApi.getDocuments(selectedProjectId)
			set({ documents: data, documentsLoading: false })
		} catch {
			set({ documents: [], documentsLoading: false })
		}
	},

	updateSources: async sources => {
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		try {
			await radarApi.updateSources(selectedProjectId, sources)
			await get().fetchProjects()
			toast.success("Custom sources updated")
		} catch (e) {
			toast.error(e.message)
			throw e
		}
	},

	updateKeywords: async keywords => {
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		try {
			const cleanKeywords = keywords
				.map(k => String(k || "").trim())
				.filter(Boolean)
			await radarApi.updateProject(selectedProjectId, {
				keyword: cleanKeywords[0] || "",
				keywords: cleanKeywords,
			})
			await get().fetchProjects()
			toast.success("Keywords updated")
		} catch (e) {
			toast.error(e.message)
			throw e
		}
	},

	updateSelectedModels: async selectedModels => {
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		try {
			const cleanModels = [
				"DEFAULT",
				...(Array.isArray(selectedModels) ? selectedModels : []),
			].filter((model, index, arr) => arr.indexOf(model) === index)
			await radarApi.updateProject(selectedProjectId, {
				selectedModels: cleanModels,
			})
			await get().fetchProjects()
			toast.success("Models updated")
		} catch (e) {
			toast.error(e.message)
			throw e
		}
	},

	updateCompetitors: async data => {
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		try {
			await radarApi.updateCompetitors(selectedProjectId, data)
			await get().fetchProjects()
			toast.success("Competitors updated")
		} catch (e) {
			toast.error(e.message)
			throw e
		}
	},

	updateEmailSettings: async data => {
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		try {
			await radarApi.updateEmailSettings(selectedProjectId, data)
			await get().fetchProjects()
			toast.success("Email settings updated")
		} catch (e) {
			toast.error(e.message)
			throw e
		}
	},

	uploads: [],
	uploadsLoading: false,

	fetchUploads: async () => {
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		set({ uploadsLoading: true })
		try {
			const data = await radarApi.getUploads(selectedProjectId)
			set({ uploads: data, uploadsLoading: false })
		} catch {
			set({ uploads: [], uploadsLoading: false })
		}
	},

	uploadDocument: async file => {
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		try {
			const result = await radarApi.uploadDocument(
				selectedProjectId,
				file
			)
			toast.success(`Uploaded ${result.filename}`)
			await get().fetchUploads()
			return result
		} catch (e) {
			toast.error(e.message)
			throw e
		}
	},

	deleteUpload: async uploadId => {
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		try {
			await radarApi.deleteUpload(selectedProjectId, uploadId)
			toast.success("Document removed")
			await get().fetchUploads()
		} catch (e) {
			toast.error(e.message)
			throw e
		}
	},

	chatOpen: false,
	chatMessages: [],
	chatLoading: false,
	chatSuggestions: [],

	toggleChat: () => set(s => ({ chatOpen: !s.chatOpen })),
	closeChat: () => set({ chatOpen: false }),

	fetchChatHistory: async () => {
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		try {
			const data = await radarApi.getChatHistory(selectedProjectId)
			set({ chatMessages: data })
		} catch {
			set({ chatMessages: [] })
		}
	},

	fetchChatSuggestions: async () => {
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		try {
			const data = await radarApi.getChatSuggestions(selectedProjectId)
			set({ chatSuggestions: data })
		} catch {
			set({ chatSuggestions: [] })
		}
	},

	sendChat: async message => {
		const { selectedProjectId } = get()
		if (!selectedProjectId || !message.trim()) return

		set(s => ({
			chatMessages: [
				...s.chatMessages,
				{ role: "user", content: message, id: `u-${Date.now()}` },
			],
			chatLoading: true,
		}))

		try {
			const result = await radarApi.sendChatMessage(
				selectedProjectId,
				message
			)
			set(s => ({
				chatMessages: [
					...s.chatMessages,
					{
						role: "assistant",
						content: result.response,
						id: `a-${Date.now()}`,
					},
				],
				chatLoading: false,
			}))
		} catch (e) {
			set(s => ({
				chatMessages: [
					...s.chatMessages,
					{
						role: "assistant",
						content: `Sorry, something went wrong: ${e.message}`,
						id: `e-${Date.now()}`,
					},
				],
				chatLoading: false,
			}))
		}
	},

	clearChat: async () => {
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		try {
			await radarApi.clearChatHistory(selectedProjectId)
			set({ chatMessages: [] })
		} catch (e) {
			toast.error(e.message)
		}
	},
}))

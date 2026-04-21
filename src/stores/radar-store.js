import { radarApi } from "@/lib/radar-api"
import { toast } from "sonner"
import { create } from "zustand"

export const useRadarStore = create((set, get) => ({
	projects: [],
	selectedProjectId: null,
	projectsLoading: true,

	activeView: "report",

	report: null,
	reportLoading: false,

	signals: [],
	signalsLoading: false,
	signalsFilter: {},

	runs: [],
	runsLoading: false,

	documents: [],
	documentsLoading: false,

	scanning: false,

	setActiveView: view => {
		set({ activeView: view })
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		if (view === "report") get().fetchReport()
		if (view === "signals") get().fetchSignals()
		if (view === "runs") get().fetchRuns()
		if (view === "documents") get().fetchDocuments()
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
		set({
			selectedProjectId: id,
			report: null,
			signals: [],
			runs: [],
			documents: [],
		})
		const { activeView } = get()
		if (activeView === "report") get().fetchReport()
		else if (activeView === "signals") get().fetchSignals()
		else if (activeView === "runs") get().fetchRuns()
		else if (activeView === "documents") get().fetchDocuments()
	},

	createProject: async data => {
		const created = await radarApi.createProject(data)
		await get().fetchProjects()
		set({ selectedProjectId: created.id })
		return created
	},

	runScan: async () => {
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		set({ scanning: true })
		try {
			const result = await radarApi.runScan(selectedProjectId)
			toast.success("Scan completed")
			set({ scanning: false })
			await get().fetchReport()
			return result
		} catch (e) {
			toast.error(e.message)
			set({ scanning: false })
			throw e
		}
	},

	fetchReport: async () => {
		const { selectedProjectId } = get()
		if (!selectedProjectId) return
		set({ reportLoading: true })
		try {
			const data = await radarApi.getReport(selectedProjectId)
			set({ report: data, reportLoading: false })
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

	setSignalsFilter: filter => {
		const current = get().signalsFilter
		const next = { ...current, ...filter }
		Object.keys(next).forEach(k => {
			if (!next[k]) delete next[k]
		})
		set({ signalsFilter: next })
		get().fetchSignals(next)
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
}))

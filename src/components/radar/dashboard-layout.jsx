"use client"

import { useRadarStore } from "@/stores/radar-store"
import { useFirebaseAuth } from "@/providers/firebase-auth-provider"
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { ReportView } from "./report-view"
import { SignalsView } from "./signals-view"
import { RunsView } from "./runs-view"
import { DocumentsView } from "./documents-view"
import { SettingsView } from "./settings-view"
import { ModelAnalysisView } from "./model-analysis-view"
import { ChatPanel } from "./chat-panel"
import { cn } from "@/lib/utils"
import {
	BarChart3,
	Brain,
	FileText,
	FolderOpen,
	History,
	Loader2,
	Play,
	Settings,
	Shield,
	Target,
	Users,
	Zap,
} from "lucide-react"

const views = {
	report: ReportView,
	signals: SignalsView,
	jobs: SignalsView,
	skills: SignalsView,
	policy: SignalsView,
	program: SignalsView,
	competitor: SignalsView,
	runs: RunsView,
	documents: DocumentsView,
	"model-analysis": ModelAnalysisView,
	settings: SettingsView,
}

const NAV_ITEMS = [
	{ key: "report", label: "Report", icon: BarChart3 },
	{ key: "jobs", label: "Jobs", icon: Target },
	{ key: "skills", label: "Skills", icon: Zap },
	{ key: "policy", label: "Policy", icon: Shield },
	{ key: "program", label: "Program", icon: FileText },
	{ key: "competitor", label: "Competitor", icon: Users },
	{ key: "documents", label: "Sources", icon: FolderOpen },
	{ key: "model-analysis", label: "Model Analysis", icon: Brain },
]

const ACTION_ITEMS = [
	{ key: "runs", label: "Runs", icon: History },
	{ key: "settings", label: "Settings", icon: Settings },
]

function formatLastScanLabel(ts) {
	if (!ts) return "No scans yet"
	const sec = ts.seconds ?? ts._seconds
	const d =
		sec != null
			? new Date(Number(sec) * 1000)
			: typeof ts === "string" || typeof ts === "number"
				? new Date(ts)
				: new Date(NaN)
	if (Number.isNaN(d.getTime())) return "No scans yet"
	return d.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	})
}

export function DashboardLayout({ urlProjectId, urlView }) {
	const router = useRouter()
	const { user, signOut } = useFirebaseAuth()
	const {
		projects,
		selectedProjectId,
		activeView,
		scanning,
		fetchProjects,
		runScan,
		syncFromUrl,
	} = useRadarStore()

	const didInit = useRef(false)

	useEffect(() => {
		fetchProjects()
	}, [fetchProjects])

	useEffect(() => {
		if (urlProjectId) {
			syncFromUrl(urlProjectId, urlView || "report")
			didInit.current = true
		}
	}, [urlProjectId, urlView, syncFromUrl])

	const selected = projects.find(p => p.id === selectedProjectId)
	const ActiveView = views[activeView] || ReportView

	const navigateView = key => {
		if (selectedProjectId) {
			router.push(`/project/${selectedProjectId}/${key}`, {
				scroll: false,
			})
		}
	}

	return (
		<div className="flex h-full min-h-0 bg-[radial-gradient(circle_at_top_left,rgba(24,24,27,0.08),transparent_28%),linear-gradient(180deg,#fafafa,#f4f4f5)] text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,#09090b,#18181b)] dark:text-zinc-50">
			<Sidebar
				user={user}
				onSignOut={signOut}
			/>

			{selected && <ChatPanel />}

			<main className="flex min-h-0 flex-1 flex-col overflow-hidden">
				{/* Project header + navigation bar */}
				<header className="shrink-0 border-b border-zinc-200/80 bg-white/85 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80">
					{/* Top row: project info + run scan */}
					<div className="flex items-center justify-between gap-4 px-7 py-4">
						<div className="min-w-0">
							<h1 className="truncate text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
								{selected ? selected.name : "Select a project"}
							</h1>
							{selected && (
								<p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
									Last scan:{" "}
									{formatLastScanLabel(selected.lastRunAt)}
								</p>
							)}
						</div>

						<div className="flex shrink-0 items-center gap-2">
							{selected &&
								ACTION_ITEMS.map(item => {
									const Icon = item.icon
									const isActive = activeView === item.key

									return (
										<button
											key={item.key}
											type="button"
											aria-label={item.label}
											title={item.label}
											onClick={() =>
												navigateView(item.key)
											}
											className={cn(
												"inline-flex size-9 items-center justify-center rounded-lg border text-zinc-500 shadow-sm transition-colors",
												isActive
													? "border-zinc-800 bg-zinc-900 text-white dark:border-zinc-600 dark:bg-zinc-100 dark:text-zinc-900"
													: "border-zinc-200 bg-white hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
											)}
										>
											<Icon className="size-4" />
										</button>
									)
								})}

							<button
								type="button"
								disabled={!selectedProjectId || scanning}
								onClick={() => runScan()}
								className={cn(
									"inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium shadow-sm transition-colors",
									"border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800",
									"disabled:pointer-events-none disabled:opacity-50",
									"dark:border-zinc-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
								)}
							>
								{scanning ? (
									<Loader2 className="size-3.5 shrink-0 animate-spin text-white dark:text-zinc-900" />
								) : (
									<Play className="size-3.5 shrink-0 text-white dark:text-zinc-900" />
								)}
								<span>
									{scanning ? "Scanning…" : "Run Scan"}
								</span>
							</button>
						</div>
					</div>

					{/* Navigation tabs */}
					{selected && (
						<nav className="flex items-center gap-1 overflow-x-auto border-t border-zinc-200/70 px-7 dark:border-zinc-800/70">
							{NAV_ITEMS.map(item => {
								const Icon = item.icon
								const isActive = activeView === item.key
								return (
									<button
										key={item.key}
										type="button"
										onClick={() => navigateView(item.key)}
										className={cn(
											"relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors",
											isActive
												? "text-zinc-950 dark:text-zinc-50"
												: "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
										)}
									>
										<Icon className="size-3.5" />
										{item.label}
										{isActive && (
											<span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-zinc-950 dark:bg-zinc-50" />
										)}
									</button>
								)
							})}
						</nav>
					)}
				</header>

				<div className="min-h-0 flex-1 overflow-y-auto pt-5">
					<ActiveView />
				</div>
			</main>
		</div>
	)
}

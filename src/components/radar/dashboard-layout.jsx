"use client"

import { useRadarStore } from "@/stores/radar-store"
import { useFirebaseAuth } from "@/providers/firebase-auth-provider"
import { useEffect } from "react"
import { Sidebar } from "./sidebar"
import { ReportView } from "./report-view"
import { SignalsView } from "./signals-view"
import { RunsView } from "./runs-view"
import { DocumentsView } from "./documents-view"
import { Button } from "@/ui/button"
import { Loader2, Play } from "lucide-react"

const views = {
	report: ReportView,
	signals: SignalsView,
	runs: RunsView,
	documents: DocumentsView,
}

export function DashboardLayout() {
	const { user, signOut } = useFirebaseAuth()
	const {
		projects,
		selectedProjectId,
		activeView,
		scanning,
		fetchProjects,
		runScan,
	} = useRadarStore()

	useEffect(() => {
		fetchProjects()
	}, [fetchProjects])

	const selected = projects.find(p => p.id === selectedProjectId)
	const ActiveView = views[activeView] || ReportView

	return (
		<div className="flex h-full min-h-0">
			<Sidebar
				user={user}
				onSignOut={signOut}
			/>

			<main className="flex min-h-0 flex-1 flex-col overflow-hidden">
				<header className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
					<div className="min-w-0">
						<h1 className="truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
							{selected ? selected.name : "Select a project"}
						</h1>
						{selected && (
							<p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
								{selected.keyword}
								{selected.competitors?.length > 0 &&
									` · ${selected.competitors.join(", ")}`}
							</p>
						)}
					</div>

					<Button
						size="sm"
						disabled={!selectedProjectId || scanning}
						onClick={() => runScan()}
						className="gap-1.5"
					>
						{scanning ? (
							<Loader2 className="size-3.5 animate-spin" />
						) : (
							<Play className="size-3.5" />
						)}
						{scanning ? "Scanning…" : "Run Scan"}
					</Button>
				</header>

				<div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-900/50">
					<ActiveView />
				</div>
			</main>
		</div>
	)
}

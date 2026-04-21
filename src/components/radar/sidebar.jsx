"use client"

import { useRadarStore } from "@/stores/radar-store"
import { cn } from "@/lib/utils"
import { Button } from "@/ui/button"
import {
	BarChart3,
	FileText,
	FolderOpen,
	History,
	LogOut,
	Plus,
	Zap,
} from "lucide-react"
import { useState } from "react"
import { ProjectFormDialog } from "./project-form-dialog"

const NAV_ITEMS = [
	{ key: "report", label: "Report", icon: BarChart3 },
	{ key: "signals", label: "Signals", icon: Zap },
	{ key: "runs", label: "Runs", icon: History },
	{ key: "documents", label: "Documents", icon: FolderOpen },
]

export function Sidebar({ user, onSignOut }) {
	const {
		projects,
		selectedProjectId,
		projectsLoading,
		activeView,
		selectProject,
		setActiveView,
	} = useRadarStore()

	const [showCreate, setShowCreate] = useState(false)

	return (
		<aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
			<div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
				<div className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
					<FileText className="size-3.5 text-white dark:text-zinc-900" />
				</div>
				<span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
					ITM Intel Radar
				</span>
			</div>

			<div className="flex-1 overflow-y-auto">
				<div className="px-3 pt-4 pb-2">
					<div className="flex items-center justify-between px-1">
						<span className="text-[11px] font-medium tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
							Projects
						</span>
						<button
							type="button"
							onClick={() => setShowCreate(true)}
							className="rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
						>
							<Plus className="size-3.5" />
						</button>
					</div>

					<div className="mt-2 space-y-0.5">
						{projectsLoading ? (
							<>
								{[1, 2, 3].map(i => (
									<div
										key={i}
										className="h-8 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800"
									/>
								))}
							</>
						) : projects.length === 0 ? (
							<p className="px-1 py-2 text-xs text-zinc-400">
								No projects yet
							</p>
						) : (
							projects.map(p => (
								<button
									key={p.id}
									type="button"
									onClick={() => selectProject(p.id)}
									className={cn(
										"flex w-full flex-col rounded-md px-2.5 py-1.5 text-left transition-colors",
										p.id === selectedProjectId
											? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
											: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
									)}
								>
									<span className="truncate text-sm font-medium">
										{p.name}
									</span>
									<span className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">
										{p.keyword}
									</span>
								</button>
							))
						)}
					</div>
				</div>

				<div className="mt-2 border-t border-zinc-200 px-3 pt-3 dark:border-zinc-800">
					<span className="px-1 text-[11px] font-medium tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
						Navigation
					</span>
					<nav className="mt-2 space-y-0.5">
						{NAV_ITEMS.map(item => {
							const Icon = item.icon
							return (
								<button
									key={item.key}
									type="button"
									onClick={() => setActiveView(item.key)}
									className={cn(
										"flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
										activeView === item.key
											? "bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
											: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
									)}
								>
									<Icon className="size-4 shrink-0" />
									{item.label}
								</button>
							)
						})}
					</nav>
				</div>
			</div>

			<div className="border-t border-zinc-200 px-3 py-3 dark:border-zinc-800">
				<div className="flex items-center gap-2">
					<div className="flex size-7 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
						{user?.email?.[0]?.toUpperCase() || "?"}
					</div>
					<span className="min-w-0 flex-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
						{user?.email}
					</span>
					<button
						type="button"
						onClick={onSignOut}
						className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
						title="Sign out"
					>
						<LogOut className="size-3.5" />
					</button>
				</div>
			</div>

			{showCreate && (
				<ProjectFormDialog onClose={() => setShowCreate(false)} />
			)}
		</aside>
	)
}

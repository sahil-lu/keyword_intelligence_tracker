"use client"

import { useRadarStore } from "@/stores/radar-store"
import { cn } from "@/lib/utils"
import { FileText, LogOut, PanelLeft, Plus, Search } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProjectFormDialog } from "./project-form-dialog"

function formatLastRun(ts) {
	if (!ts) return "Never"
	const sec = ts.seconds ?? ts._seconds
	const date =
		sec != null
			? new Date(Number(sec) * 1000)
			: typeof ts === "string" || typeof ts === "number"
				? new Date(ts)
				: new Date(NaN)
	if (Number.isNaN(date.getTime())) return "Never"

	const diffMs = Date.now() - date.getTime()
	const minutes = Math.max(0, Math.floor(diffMs / 60000))
	if (minutes < 1) return "Just now"
	if (minutes < 60) return `${minutes} min ago`

	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`

	const days = Math.floor(hours / 24)
	return `${days} day${days === 1 ? "" : "s"} ago`
}

export function Sidebar({ user, onSignOut }) {
	const router = useRouter()
	const { projects, selectedProjectId, projectsLoading, activeView } =
		useRadarStore()

	const [showCreate, setShowCreate] = useState(false)
	const [showSearch, setShowSearch] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")
	const [collapsed, setCollapsed] = useState(false)

	const filteredProjects = searchQuery.trim()
		? projects.filter(
				p =>
					p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					p.keyword?.toLowerCase().includes(searchQuery.toLowerCase())
			)
		: projects

	const recentProjects = projects.slice(0, 10)

	const navigateToProject = id => {
		const view = activeView || "report"
		router.push(`/project/${id}/${view}`)
	}

	return (
		<aside
			className={cn(
				"flex shrink-0 flex-col border-r border-zinc-200 bg-[#f9f9f8] text-zinc-950 transition-[width] duration-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50",
				collapsed ? "w-16" : "w-72"
			)}
		>
			<div
				className={cn(
					"flex items-center px-4 py-4",
					collapsed ? "justify-center" : "justify-between"
				)}
			>
				{!collapsed && (
					<div className="flex size-8 items-center justify-center rounded-full text-zinc-900 dark:text-zinc-100">
						<FileText className="size-5" />
					</div>
				)}
				<button
					type="button"
					onClick={() => setCollapsed(value => !value)}
					className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
					title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
					aria-label={
						collapsed ? "Expand sidebar" : "Collapse sidebar"
					}
					aria-expanded={!collapsed}
				>
					<PanelLeft
						className={cn(
							"size-4 transition-transform",
							collapsed && "rotate-180"
						)}
					/>
				</button>
			</div>

			<div className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
				<SidebarAction
					icon={Plus}
					label="New project"
					onClick={() => setShowCreate(true)}
					collapsed={collapsed}
				/>
				<SidebarAction
					icon={Search}
					label="Search projects"
					onClick={() => {
						setSearchQuery("")
						setShowSearch(true)
					}}
					collapsed={collapsed}
				/>
			</div>

			{/* Project list */}
			<div
				className={cn(
					"mt-7 flex-1 overflow-y-auto",
					collapsed ? "px-2" : "px-3"
				)}
			>
				{!collapsed && (
					<div className="mb-2 px-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
						Projects
					</div>
				)}
				{projectsLoading ? (
					<div className="space-y-1.5">
						{[1, 2, 3, 4].map(i => (
							<div
								key={i}
								className={cn(
									"animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800",
									collapsed ? "mx-auto size-9" : "h-9"
								)}
							/>
						))}
					</div>
				) : recentProjects.length === 0 ? (
					<div className={cn("py-3", collapsed ? "px-0" : "px-2")}>
						{!collapsed && (
							<p className="text-sm text-zinc-500 dark:text-zinc-400">
								No projects yet
							</p>
						)}
						<button
							type="button"
							onClick={() => setShowCreate(true)}
							className={cn(
								collapsed
									? "flex size-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
									: "mt-2 text-sm text-zinc-900 hover:underline dark:text-zinc-100"
							)}
							title="Create your first project"
							aria-label="Create your first project"
						>
							{collapsed ? (
								<Plus className="size-4" />
							) : (
								"Create your first project"
							)}
						</button>
					</div>
				) : (
					<div className="space-y-0.5">
						{recentProjects.map(p => (
							<ProjectRow
								key={p.id}
								project={p}
								active={p.id === selectedProjectId}
								onClick={() => navigateToProject(p.id)}
								collapsed={collapsed}
							/>
						))}
					</div>
				)}
			</div>

			{/* User footer */}
			<div
				className={cn(
					"border-t border-zinc-200 py-3 dark:border-zinc-800",
					collapsed ? "px-2" : "px-3"
				)}
			>
				<div
					className={cn(
						"flex items-center gap-3 rounded-xl py-2",
						collapsed ? "flex-col px-0" : "px-2"
					)}
				>
					<div className="flex size-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
						{user?.email?.[0]?.toUpperCase() || "?"}
					</div>
					{!collapsed && (
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
								{user?.email?.split("@")?.[0] || "User"}
							</p>
							<p className="truncate text-xs text-zinc-500 dark:text-zinc-500">
								ITM workspace
							</p>
						</div>
					)}
					<button
						type="button"
						onClick={onSignOut}
						className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
						title="Sign out"
					>
						<LogOut className="size-4" />
					</button>
				</div>
			</div>

			{showSearch && (
				<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 px-4 pt-[14vh] backdrop-blur-sm dark:bg-black/50">
					<div className="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/20 dark:border-zinc-800 dark:bg-zinc-950">
						<div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
							<Search className="size-4 shrink-0 text-zinc-400" />
							<input
								autoFocus
								type="text"
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								placeholder="Search projects..."
								className="h-9 flex-1 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
								onKeyDown={e => {
									if (e.key === "Escape") setShowSearch(false)
								}}
							/>
							<button
								type="button"
								onClick={() => setShowSearch(false)}
								className="rounded-md px-2 py-1 text-lg leading-none text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
							>
								×
							</button>
						</div>

						<div className="max-h-[420px] overflow-y-auto p-3">
							{filteredProjects.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
										No projects found
									</p>
									<p className="mt-1 text-xs text-zinc-500">
										Try a different project name or keyword.
									</p>
								</div>
							) : (
								<div className="space-y-4">
									<div>
										<p className="px-2 pb-1 text-[11px] font-medium text-zinc-400">
											Projects
										</p>
										<div className="space-y-1">
											{filteredProjects.map(p => (
												<ProjectRow
													key={p.id}
													project={p}
													active={
														p.id ===
														selectedProjectId
													}
													onClick={() => {
														navigateToProject(p.id)
														setShowSearch(false)
													}}
													collapsed={false}
												/>
											))}
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{showCreate && (
				<ProjectFormDialog onClose={() => setShowCreate(false)} />
			)}
		</aside>
	)
}

function SidebarAction({ icon: Icon, label, onClick, collapsed = false }) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={label}
			aria-label={label}
			className={cn(
				"flex w-full items-center rounded-lg py-2 text-sm text-zinc-800 transition-colors hover:bg-zinc-200/70 dark:text-zinc-200 dark:hover:bg-zinc-800",
				collapsed ? "justify-center px-0" : "gap-3 px-2.5 text-left"
			)}
		>
			<Icon className="size-4 text-zinc-700 dark:text-zinc-300" />
			{!collapsed && <span>{label}</span>}
		</button>
	)
}

function ProjectRow({ project, active, onClick, collapsed = false }) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={project.name}
			aria-label={project.name}
			className={cn(
				"flex w-full items-center rounded-lg py-2 text-left text-sm transition-colors",
				collapsed ? "justify-center px-0" : "gap-3 px-2.5",
				active
					? "bg-zinc-200/80 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50"
					: "text-zinc-800 hover:bg-zinc-200/70 dark:text-zinc-200 dark:hover:bg-zinc-800"
			)}
		>
			<span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700">
				<span
					className={cn(
						"size-2 rounded-full",
						active
							? "bg-zinc-950 dark:bg-zinc-50"
							: "bg-transparent"
					)}
				/>
			</span>
			{!collapsed && (
				<span className="min-w-0 flex-1">
					<span className="block truncate">{project.name}</span>
					<span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-500">
						<span className="truncate">
							{formatLastRun(project.lastRunAt)}
						</span>
					</span>
				</span>
			)}
		</button>
	)
}

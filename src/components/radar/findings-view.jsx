"use client"

import { useRadarStore } from "@/stores/radar-store"
import { Badge } from "@/ui/badge"
import { Skeleton } from "@/ui/skeleton"
import { cn } from "@/lib/utils"
import { ExternalLink, Search } from "lucide-react"
import { useEffect } from "react"

const PRIORITIES = ["ALL", "HIGH", "MEDIUM", "LOW"]
const CHANGE_TYPES = ["ALL", "new", "updated", "existing"]
const CATEGORIES = [
	"ALL",
	"pricing",
	"product",
	"news",
	"analysis",
	"review",
	"comparison",
	"partnership",
	"regulation",
	"other",
]

function priorityColor(p) {
	if (p === "HIGH")
		return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
	if (p === "MEDIUM")
		return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
	return "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
}

function changeColor(t) {
	if (t === "new")
		return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
	if (t === "updated")
		return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300"
	return "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
}

function hostOf(url) {
	try {
		return new URL(url).hostname.replace(/^www\./, "")
	} catch {
		return url || ""
	}
}

function FilterChip({ label, active, onClick }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
				active
					? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
					: "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
			)}
		>
			{label}
		</button>
	)
}

function FindingsTableSkeleton() {
	return (
		<div className="space-y-2">
			{[1, 2, 3, 4, 5].map(i => (
				<Skeleton
					key={i}
					className="h-16 w-full rounded-lg"
				/>
			))}
		</div>
	)
}

export function FindingsView() {
	const {
		findings,
		findingsLoading,
		findingsFilter,
		setFindingsFilter,
		selectedProjectId,
		fetchFindings,
	} = useRadarStore()

	useEffect(() => {
		if (selectedProjectId) fetchFindings()
	}, [selectedProjectId, fetchFindings])

	const activePriority = findingsFilter.priority || "ALL"
	const activeChangeType = findingsFilter.change_type || "ALL"
	const activeCategory = findingsFilter.category || "ALL"

	return (
		<div className="mx-auto max-w-6xl space-y-6 p-6">
			<div className="space-y-3">
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-xs font-medium text-zinc-500">
						Priority:
					</span>
					{PRIORITIES.map(p => (
						<FilterChip
							key={p}
							label={p}
							active={activePriority === p}
							onClick={() =>
								setFindingsFilter({
									priority: p === "ALL" ? null : p,
								})
							}
						/>
					))}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-xs font-medium text-zinc-500">
						Change:
					</span>
					{CHANGE_TYPES.map(c => (
						<FilterChip
							key={c}
							label={c === "ALL" ? "ALL" : c.toUpperCase()}
							active={activeChangeType === c}
							onClick={() =>
								setFindingsFilter({
									change_type: c === "ALL" ? null : c,
								})
							}
						/>
					))}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-xs font-medium text-zinc-500">
						Category:
					</span>
					{CATEGORIES.map(c => (
						<FilterChip
							key={c}
							label={c === "ALL" ? "ALL" : c}
							active={activeCategory === c}
							onClick={() =>
								setFindingsFilter({
									category: c === "ALL" ? null : c,
								})
							}
						/>
					))}
				</div>
			</div>

			{findingsLoading ? (
				<FindingsTableSkeleton />
			) : findings.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
						<Search className="size-5 text-zinc-400" />
					</div>
					<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
						No findings
					</p>
					<p className="mt-1 text-xs text-zinc-500">
						Run a scan or adjust your filters.
					</p>
				</div>
			) : (
				<div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
								<th className="px-4 py-2.5">Title</th>
								<th className="px-4 py-2.5">Entity</th>
								<th className="px-4 py-2.5">Category</th>
								<th className="px-4 py-2.5">Priority</th>
								<th className="px-4 py-2.5">Change</th>
								<th className="px-4 py-2.5">Source</th>
							</tr>
						</thead>
						<tbody>
							{findings.map((f, i) => (
								<tr
									key={f.id || i}
									className="border-b border-zinc-50 transition-colors last:border-0 hover:bg-zinc-50/50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/30"
								>
									<td className="max-w-xs px-4 py-3">
										<p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
											{f.title}
										</p>
										<p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
											{f.summary}
										</p>
									</td>
									<td className="px-4 py-3 text-xs text-zinc-500">
										{f.entity !== "unknown"
											? f.entity
											: "—"}
									</td>
									<td className="px-4 py-3">
										<span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
											{f.category}
										</span>
									</td>
									<td className="px-4 py-3">
										<Badge
											variant="outline"
											className={cn(
												"text-[10px] uppercase",
												priorityColor(f.priority)
											)}
										>
											{f.priority}
										</Badge>
									</td>
									<td className="px-4 py-3">
										<Badge
											variant="outline"
											className={cn(
												"text-[10px] uppercase",
												changeColor(f.change_type)
											)}
										>
											{f.change_type}
										</Badge>
									</td>
									<td className="px-4 py-3">
										{f.url && (
											<a
												href={f.url}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
											>
												{hostOf(f.url)}
												<ExternalLink className="size-3" />
											</a>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}

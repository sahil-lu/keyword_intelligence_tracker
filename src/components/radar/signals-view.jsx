"use client"

import { useRadarStore } from "@/stores/radar-store"
import { Badge } from "@/ui/badge"
import { Skeleton } from "@/ui/skeleton"
import { cn } from "@/lib/utils"
import { ExternalLink, Search } from "lucide-react"
import { useEffect } from "react"

const PRIORITIES = ["ALL", "HIGH", "MEDIUM", "LOW"]
const CHANGE_TYPES = ["ALL", "new", "updated", "existing"]
const AGENTS = [
	{ key: "ALL", label: "All" },
	{ key: "jobs", label: "Jobs" },
	{ key: "skills", label: "Skills" },
	{ key: "policy", label: "Policy" },
	{ key: "program", label: "Program" },
	{ key: "competitor", label: "Competitor" },
]

const AGENT_COLORS = {
	jobs: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30",
	skills: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30",
	policy: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
	program:
		"bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
	competitor:
		"bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30",
	other: "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
}

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

function SignalsTableSkeleton() {
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

export function SignalsView() {
	const {
		signals,
		signalsLoading,
		signalsFilter,
		setSignalsFilter,
		selectedProjectId,
		fetchSignals,
	} = useRadarStore()

	useEffect(() => {
		if (selectedProjectId) fetchSignals()
	}, [selectedProjectId, fetchSignals])

	const activePriority = signalsFilter.priority || "ALL"
	const activeChangeType = signalsFilter.change_type || "ALL"
	const activeAgent = signalsFilter.agent || "ALL"

	return (
		<div className="mx-auto max-w-6xl space-y-6 p-6">
			<div className="space-y-3">
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-xs font-medium text-zinc-500">
						Agent:
					</span>
					{AGENTS.map(a => (
						<FilterChip
							key={a.key}
							label={a.label}
							active={activeAgent === a.key}
							onClick={() =>
								setSignalsFilter({
									agent: a.key === "ALL" ? null : a.key,
								})
							}
						/>
					))}
				</div>
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
								setSignalsFilter({
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
								setSignalsFilter({
									change_type: c === "ALL" ? null : c,
								})
							}
						/>
					))}
				</div>
			</div>

			{signalsLoading ? (
				<SignalsTableSkeleton />
			) : signals.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
						<Search className="size-5 text-zinc-400" />
					</div>
					<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
						No signals
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
								<th className="px-4 py-2.5">Agent</th>
								<th className="px-4 py-2.5">What Changed</th>
								<th className="px-4 py-2.5">Impact</th>
								<th className="px-4 py-2.5">Action</th>
								<th className="px-4 py-2.5">Priority</th>
								<th className="px-4 py-2.5">Source</th>
							</tr>
						</thead>
						<tbody>
							{signals.map((s, i) => (
								<tr
									key={s.id || i}
									className="border-b border-zinc-50 transition-colors last:border-0 hover:bg-zinc-50/50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/30"
								>
									<td className="max-w-[180px] px-4 py-3">
										<p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
											{s.title}
										</p>
									</td>
									<td className="px-4 py-3">
										<span
											className={cn(
												"inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase",
												AGENT_COLORS[s.agent] ||
													AGENT_COLORS.other
											)}
										>
											{s.agent}
										</span>
									</td>
									<td className="max-w-[200px] px-4 py-3">
										<p className="line-clamp-2 text-xs text-zinc-600 dark:text-zinc-300">
											{s.what_changed}
										</p>
									</td>
									<td className="max-w-[180px] px-4 py-3">
										<p className="line-clamp-2 text-xs text-amber-700 dark:text-amber-300">
											{s.impact_on_itm}
										</p>
									</td>
									<td className="max-w-[180px] px-4 py-3">
										<p className="line-clamp-2 text-xs text-emerald-700 dark:text-emerald-300">
											{s.recommended_action}
										</p>
									</td>
									<td className="px-4 py-3">
										<Badge
											variant="outline"
											className={cn(
												"text-[10px] uppercase",
												priorityColor(s.priority)
											)}
										>
											{s.priority}
										</Badge>
									</td>
									<td className="px-4 py-3">
										{s.url && (
											<a
												href={s.url}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
											>
												{hostOf(s.url)}
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

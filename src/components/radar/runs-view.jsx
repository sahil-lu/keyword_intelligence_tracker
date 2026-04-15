"use client"

import { useRadarStore } from "@/stores/radar-store"
import { Badge } from "@/ui/badge"
import { Skeleton } from "@/ui/skeleton"
import { cn } from "@/lib/utils"
import { CheckCircle, Clock, History, XCircle } from "lucide-react"
import { useEffect } from "react"

function formatDate(ts) {
	if (!ts) return "—"
	const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts)
	if (Number.isNaN(d.getTime())) return "—"
	return d.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	})
}

function formatDuration(ms) {
	if (!ms) return "—"
	if (ms < 1000) return `${ms}ms`
	return `${(ms / 1000).toFixed(1)}s`
}

function statusColor(s) {
	if (s === "completed") return "text-emerald-600 dark:text-emerald-400"
	if (s === "failed") return "text-red-600 dark:text-red-400"
	return "text-amber-500 dark:text-amber-400"
}

function StatusIcon({ status }) {
	if (status === "completed")
		return <CheckCircle className="size-4 text-emerald-500" />
	if (status === "failed") return <XCircle className="size-4 text-red-500" />
	return <Clock className="size-4 animate-pulse text-amber-500" />
}

function RunsSkeleton() {
	return (
		<div className="space-y-2">
			{[1, 2, 3].map(i => (
				<Skeleton
					key={i}
					className="h-20 w-full rounded-xl"
				/>
			))}
		</div>
	)
}

export function RunsView() {
	const { runs, runsLoading, selectedProjectId, fetchRuns } = useRadarStore()

	useEffect(() => {
		if (selectedProjectId) fetchRuns()
	}, [selectedProjectId, fetchRuns])

	return (
		<div className="mx-auto max-w-4xl space-y-6 p-6">
			<div className="flex items-center gap-2">
				<div className="flex size-7 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
					<History className="size-3.5 text-zinc-500" />
				</div>
				<h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
					Run History
				</h2>
			</div>

			{runsLoading ? (
				<RunsSkeleton />
			) : runs.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
						<History className="size-5 text-zinc-400" />
					</div>
					<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
						No runs yet
					</p>
					<p className="mt-1 text-xs text-zinc-500">
						Run a scan to start tracking history.
					</p>
				</div>
			) : (
				<div className="space-y-2">
					{runs.map(run => (
						<div
							key={run.id}
							className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
						>
							<StatusIcon status={run.status} />
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<span
										className={cn(
											"text-sm font-medium capitalize",
											statusColor(run.status)
										)}
									>
										{run.status}
									</span>
									<span className="text-xs text-zinc-400">
										{formatDate(run.createdAt)}
									</span>
								</div>
								{run.error && (
									<p className="mt-0.5 text-xs text-red-500">
										{run.error}
									</p>
								)}
							</div>

							<div className="flex shrink-0 items-center gap-3 text-xs text-zinc-500">
								{run.totalItems != null && (
									<div className="text-center">
										<p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
											{run.totalItems}
										</p>
										<p>items</p>
									</div>
								)}
								{run.highPriorityCount != null && (
									<div className="text-center">
										<p className="text-sm font-semibold text-red-600 dark:text-red-400">
											{run.highPriorityCount}
										</p>
										<p>high</p>
									</div>
								)}
								{run.newItems != null && (
									<div className="text-center">
										<p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
											{run.newItems}
										</p>
										<p>new</p>
									</div>
								)}
								<div className="text-center">
									<p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
										{formatDuration(run.duration)}
									</p>
									<p>time</p>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

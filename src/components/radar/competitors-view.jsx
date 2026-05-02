"use client"

import { useRadarStore } from "@/stores/radar-store"
import { Badge } from "@/ui/badge"
import { Skeleton } from "@/ui/skeleton"
import { cn } from "@/lib/utils"
import { ExternalLink, Search, TrendingUp, Users } from "lucide-react"
import { useEffect, useMemo } from "react"

function priorityColor(p) {
	if (p === "HIGH")
		return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
	if (p === "MEDIUM")
		return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
	return "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
}

function hostOf(url) {
	try {
		return new URL(url).hostname.replace(/^www\./, "")
	} catch {
		return url || ""
	}
}

function confidenceBar(score) {
	const pct = Math.round((score || 0) * 100)
	const color =
		score >= 0.7
			? "bg-emerald-500"
			: score >= 0.4
				? "bg-amber-500"
				: "bg-red-400"
	return (
		<div
			className="flex items-center gap-1"
			title={`${pct}%`}
		>
			<div className="h-1.5 w-10 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
				<div
					className={cn("h-full rounded-full", color)}
					style={{ width: `${pct}%` }}
				/>
			</div>
			<span className="text-[9px] text-zinc-400">{pct}%</span>
		</div>
	)
}

export function CompetitorsView() {
	const {
		signals,
		signalsLoading,
		selectedProjectId,
		fetchSignals,
		projects,
	} = useRadarStore()
	const project = projects.find(p => p.id === selectedProjectId)

	useEffect(() => {
		if (selectedProjectId) fetchSignals({ agent: "competitor" })
	}, [selectedProjectId, fetchSignals])

	const competitors = project?.competitors || []
	const competitorDomains = project?.competitorDomains || []

	const grouped = useMemo(() => {
		const map = {}

		for (const c of competitors) {
			map[c] = { name: c, signals: [], latest: null }
		}

		for (const s of signals) {
			const entity = s.entity
			if (entity && map[entity]) {
				map[entity].signals.push(s)
				if (
					!map[entity].latest ||
					(s.createdAt?._seconds || 0) >
						(map[entity].latest.createdAt?._seconds || 0)
				) {
					map[entity].latest = s
				}
			} else if (s.agent === "competitor") {
				let matched = false
				for (const c of competitors) {
					const lower =
						`${s.title} ${s.what_changed} ${s.url}`.toLowerCase()
					if (lower.includes(c.toLowerCase())) {
						if (!map[c])
							map[c] = { name: c, signals: [], latest: null }
						map[c].signals.push(s)
						if (!map[c].latest) map[c].latest = s
						matched = true
						break
					}
				}
				if (!matched) {
					const key = "_unmatched"
					if (!map[key])
						map[key] = {
							name: "Other Competitor Signals",
							signals: [],
							latest: null,
						}
					map[key].signals.push(s)
					if (!map[key].latest) map[key].latest = s
				}
			}
		}

		return Object.values(map).sort(
			(a, b) => b.signals.length - a.signals.length
		)
	}, [signals, competitors])

	if (signalsLoading) {
		return (
			<div className="mx-auto max-w-5xl space-y-4 p-6">
				{[1, 2, 3].map(i => (
					<Skeleton
						key={i}
						className="h-40 w-full rounded-xl"
					/>
				))}
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-5xl space-y-6 p-6">
			<div className="flex items-center gap-2">
				<div className="flex size-7 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
					<Users className="size-3.5 text-zinc-500" />
				</div>
				<h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
					Competitor Intelligence
				</h2>
			</div>

			{competitors.length === 0 && competitorDomains.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
						<Users className="size-5 text-zinc-400" />
					</div>
					<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
						No competitors configured
					</p>
					<p className="mt-1 max-w-xs text-xs text-zinc-500">
						Go to Settings to add competitor names and domains for
						tracking.
					</p>
				</div>
			) : grouped.length === 0 ||
			  grouped.every(g => g.signals.length === 0) ? (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
						<Search className="size-5 text-zinc-400" />
					</div>
					<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
						No competitor signals yet
					</p>
					<p className="mt-1 text-xs text-zinc-500">
						Run a scan to detect competitor activity.
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{grouped.map(g => (
						<CompetitorCard
							key={g.name}
							group={g}
						/>
					))}
				</div>
			)}
		</div>
	)
}

function CompetitorCard({ group }) {
	const highCount = group.signals.filter(s => s.priority === "HIGH").length
	const sorted = [...group.signals].sort((a, b) => {
		const pa = { HIGH: 3, MEDIUM: 2, LOW: 1 }
		return (pa[b.priority] || 0) - (pa[a.priority] || 0)
	})

	return (
		<div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
			<div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
				<div className="flex items-center gap-3">
					<div className="flex size-8 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
						<TrendingUp className="size-4" />
					</div>
					<div>
						<h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
							{group.name}
						</h3>
						<p className="text-[11px] text-zinc-500">
							{group.signals.length} signal
							{group.signals.length !== 1 ? "s" : ""}
						</p>
					</div>
				</div>
				{highCount > 0 && (
					<Badge
						variant="outline"
						className={cn(
							"text-[10px] uppercase",
							priorityColor("HIGH")
						)}
					>
						{highCount} HIGH
					</Badge>
				)}
			</div>

			<div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
				{sorted.slice(0, 5).map((s, i) => (
					<div
						key={s.id || i}
						className="flex items-start gap-3 px-5 py-3"
					>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
									{s.title}
								</p>
								<Badge
									variant="outline"
									className={cn(
										"shrink-0 text-[9px] uppercase",
										priorityColor(s.priority)
									)}
								>
									{s.priority}
								</Badge>
							</div>
							<p className="mt-1 line-clamp-1 text-xs text-zinc-500">
								{s.what_changed}
							</p>
							{s.recommended_action && (
								<p className="mt-1 line-clamp-1 text-xs text-emerald-600 dark:text-emerald-400">
									{s.recommended_action}
								</p>
							)}
						</div>
						<div className="flex shrink-0 flex-col items-end gap-1">
							{confidenceBar(s.confidence_score)}
							{s.url && (
								<a
									href={s.url}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-0.5 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
								>
									{hostOf(s.url)}
									<ExternalLink className="size-2.5" />
								</a>
							)}
						</div>
					</div>
				))}
			</div>

			{group.signals.length > 5 && (
				<div className="border-t border-zinc-100 px-5 py-2 text-center dark:border-zinc-800">
					<p className="text-[11px] text-zinc-400">
						+{group.signals.length - 5} more signals
					</p>
				</div>
			)}
		</div>
	)
}

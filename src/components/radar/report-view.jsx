"use client"

import { useRadarStore } from "@/stores/radar-store"
import { Badge } from "@/ui/badge"
import { Separator } from "@/ui/separator"
import { Skeleton } from "@/ui/skeleton"
import { cn } from "@/lib/utils"
import {
	AlertTriangle,
	ArrowUpRight,
	BarChart3,
	CheckCircle2,
	ExternalLink,
	FileText,
	Globe,
	ListChecks,
	Sparkles,
	TrendingUp,
} from "lucide-react"
import { useEffect } from "react"

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

function StatChip({ icon: Icon, label, value, accent }) {
	return (
		<div
			className={cn(
				"flex items-center gap-2 rounded-lg border px-3 py-2",
				accent ||
					"border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
			)}
		>
			<Icon className="size-4 shrink-0 text-zinc-400" />
			<div>
				<p className="text-lg leading-none font-semibold text-zinc-900 dark:text-zinc-50">
					{value}
				</p>
				<p className="mt-0.5 text-[11px] text-zinc-500">{label}</p>
			</div>
		</div>
	)
}

function ReportSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex gap-3">
				{[1, 2, 3, 4].map(i => (
					<Skeleton
						key={i}
						className="h-16 w-32 rounded-lg"
					/>
				))}
			</div>
			<Skeleton className="h-24 w-full rounded-xl" />
			<div className="grid grid-cols-2 gap-4">
				{[1, 2, 3, 4].map(i => (
					<Skeleton
						key={i}
						className="h-40 rounded-xl"
					/>
				))}
			</div>
		</div>
	)
}

function EmptyReport() {
	return (
		<div className="flex flex-col items-center justify-center py-20 text-center">
			<div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
				<FileText className="size-6 text-zinc-400" />
			</div>
			<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
				No report yet
			</p>
			<p className="mt-1 max-w-xs text-xs text-zinc-500">
				Run a scan to generate your first intelligence report from the
				web.
			</p>
		</div>
	)
}

export function ReportView() {
	const { report, reportLoading, selectedProjectId, fetchReport } =
		useRadarStore()

	useEffect(() => {
		if (selectedProjectId) fetchReport()
	}, [selectedProjectId, fetchReport])

	if (reportLoading) {
		return (
			<div className="mx-auto max-w-5xl p-6">
				<ReportSkeleton />
			</div>
		)
	}

	const r = report?.report
	if (!r) {
		return (
			<div className="mx-auto max-w-5xl p-6">
				<EmptyReport />
			</div>
		)
	}

	const stats = r.stats || {}

	return (
		<div className="mx-auto max-w-5xl space-y-8 p-6 pb-12">
			{/* Stat chips */}
			<div className="flex flex-wrap gap-3">
				<StatChip
					icon={Globe}
					label="Total sources"
					value={stats.total ?? "—"}
				/>
				<StatChip
					icon={TrendingUp}
					label="New"
					value={stats.new ?? "—"}
				/>
				<StatChip
					icon={ArrowUpRight}
					label="Updated"
					value={stats.updated ?? "—"}
				/>
				<StatChip
					icon={AlertTriangle}
					label="High priority"
					value={stats.high ?? "—"}
					accent="border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5"
				/>
			</div>

			{/* Executive summary */}
			<section className="space-y-3">
				<SectionHeader
					icon={Sparkles}
					label="Executive Summary"
				/>
				<div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
					<p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
						{r.executive_summary}
					</p>
					{r.strategic_insights && (
						<p className="mt-3 border-t border-zinc-100 pt-3 text-sm leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
							{r.strategic_insights}
						</p>
					)}
				</div>
			</section>

			<Separator />

			{/* Top findings */}
			{r.top_findings?.length > 0 && (
				<section className="space-y-3">
					<SectionHeader
						icon={BarChart3}
						label="Top Findings"
					/>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{r.top_findings
							.filter(f => f.priority !== "LOW")
							.map((f, i) => (
								<FindingCard
									key={`${f.url}-${i}`}
									finding={f}
								/>
							))}
					</div>
				</section>
			)}

			{/* Competitor updates */}
			{r.competitor_updates?.length > 0 && (
				<>
					<Separator />
					<section className="space-y-3">
						<SectionHeader
							icon={TrendingUp}
							label="Competitor Updates"
						/>
						<div className="space-y-4">
							{r.competitor_updates.map((cu, i) => (
								<div
									key={`${cu.competitor}-${i}`}
									className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
								>
									<h4 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
										{cu.competitor}
									</h4>
									<ul className="space-y-1.5">
										{cu.insights.map((ci, j) => (
											<li
												key={j}
												className="flex items-start gap-2 text-sm"
											>
												<Badge
													variant="outline"
													className={cn(
														"mt-0.5 shrink-0 text-[10px]",
														priorityColor(
															ci.priority
														)
													)}
												>
													{ci.priority}
												</Badge>
												<span className="text-zinc-600 dark:text-zinc-300">
													{ci.summary}
												</span>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</section>
				</>
			)}

			{/* What changed */}
			{r.what_changed?.length > 0 && (
				<>
					<Separator />
					<section className="space-y-3">
						<SectionHeader
							icon={ArrowUpRight}
							label="What Changed"
						/>
						<div className="space-y-2">
							{r.what_changed.map((w, i) => (
								<div
									key={`${w.url}-${i}`}
									className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
								>
									<Badge
										variant="outline"
										className={cn(
											"mt-0.5 shrink-0 text-[10px] uppercase",
											changeColor(w.change_type)
										)}
									>
										{w.change_type}
									</Badge>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
											{w.title}
										</p>
										<p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
											{w.summary}
										</p>
									</div>
								</div>
							))}
						</div>
					</section>
				</>
			)}

			{/* Source breakdown */}
			{r.source_breakdown?.length > 0 && (
				<>
					<Separator />
					<section className="space-y-3">
						<SectionHeader
							icon={Globe}
							label="Source Breakdown"
						/>
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
							{r.source_breakdown.slice(0, 8).map((s, i) => (
								<div
									key={`${s.domain}-${i}`}
									className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
								>
									<p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
										{s.domain}
									</p>
									<p className="text-xs text-zinc-500">
										{s.count} source{s.count !== 1 && "s"}
									</p>
								</div>
							))}
						</div>
					</section>
				</>
			)}

			{/* Recommendations */}
			{r.recommendations?.length > 0 && (
				<>
					<Separator />
					<section className="space-y-3">
						<SectionHeader
							icon={ListChecks}
							label="Recommendations"
						/>
						<ul className="space-y-2">
							{r.recommendations.map((rec, i) => (
								<li
									key={i}
									className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
								>
									<span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
										<CheckCircle2 className="size-3.5" />
									</span>
									<div className="min-w-0 flex-1">
										<p className="text-sm text-zinc-700 dark:text-zinc-200">
											{rec.action || rec}
										</p>
										{rec.context && (
											<p className="mt-0.5 text-[11px] text-zinc-400">
												{rec.context}
											</p>
										)}
									</div>
									{rec.priority && (
										<Badge
											variant="outline"
											className={cn(
												"shrink-0 self-start text-[10px]",
												priorityColor(rec.priority)
											)}
										>
											{rec.priority}
										</Badge>
									)}
								</li>
							))}
						</ul>
					</section>
				</>
			)}
		</div>
	)
}

function SectionHeader({ icon: Icon, label }) {
	return (
		<div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
			<div className="flex size-7 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
				<Icon className="size-3.5 text-zinc-500" />
			</div>
			{label}
		</div>
	)
}

function FindingCard({ finding }) {
	const f = finding
	return (
		<article className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
			<div className="flex items-start justify-between gap-2">
				<h3 className="min-w-0 flex-1 text-sm leading-snug font-semibold text-zinc-900 dark:text-zinc-50">
					{f.title || "Untitled"}
				</h3>
				<div className="flex shrink-0 gap-1.5">
					<Badge
						variant="outline"
						className={cn(
							"text-[10px] uppercase",
							priorityColor(f.priority)
						)}
					>
						{f.priority}
					</Badge>
					<Badge
						variant="outline"
						className={cn(
							"text-[10px] uppercase",
							changeColor(f.change_type)
						)}
					>
						{f.change_type}
					</Badge>
				</div>
			</div>

			<div className="mt-1.5 flex items-center gap-2">
				{f.category && (
					<span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
						{f.category}
					</span>
				)}
				{f.entity && f.entity !== "unknown" && (
					<span className="text-[11px] text-zinc-400">
						{f.entity}
					</span>
				)}
			</div>

			<p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
				{f.summary}
			</p>

			{f.why_it_matters && (
				<p className="mt-1.5 text-xs text-zinc-400 italic">
					{f.why_it_matters}
				</p>
			)}

			<div className="mt-auto flex items-center justify-between pt-3">
				<span className="truncate text-[11px] text-zinc-400">
					{hostOf(f.url)}
				</span>
				{f.url && (
					<a
						href={f.url}
						target="_blank"
						rel="noopener noreferrer"
						className="rounded p-1 text-zinc-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
					>
						<ExternalLink className="size-3.5" />
					</a>
				)}
			</div>
		</article>
	)
}

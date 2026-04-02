"use client"

import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { Separator } from "@/ui/separator"
import { cn } from "@/lib/utils"
import {
	CheckCircle2,
	ExternalLink,
	FileText,
	LayoutDashboard,
	ListChecks,
	Sparkles,
} from "lucide-react"

/**
 * Parse stats from pipeline executive_summary string, e.g.
 * "Analyzed 20 sources (5 new URLs this run). Top themes: ..."
 */
function parseExecutiveStats(summary) {
	const text = String(summary || "")
	const analyzed = text.match(/Analyzed\s+(\d+)\s+sources/i)
	const newUrls = text.match(/\((\d+)\s+new\s+URLs/i)
	const themesMatch = text.match(/Top themes:\s*(.+?)(?:\.|$)/i)
	return {
		sources: analyzed ? Number(analyzed[1]) : null,
		newUrls: newUrls ? Number(newUrls[1]) : null,
		themesLine: themesMatch ? themesMatch[1].trim() : null,
		raw: text,
	}
}

function themeChips(themesLine) {
	if (!themesLine) return []
	return themesLine
		.split(",")
		.map(s => s.trim())
		.filter(Boolean)
		.slice(0, 6)
}

function priorityStyles(score) {
	const s = String(score || "").toUpperCase()
	if (s === "HIGH") {
		return {
			badge: "border-red-200/80 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300",
			cardTint:
				"bg-red-500/[0.03] dark:bg-red-500/[0.06] border-red-200/40 dark:border-red-500/20",
		}
	}
	if (s === "MEDIUM") {
		return {
			badge: "border-amber-200/90 bg-amber-400/15 text-amber-900 dark:border-amber-500/35 dark:bg-amber-400/10 dark:text-amber-200",
			cardTint:
				"bg-amber-400/[0.06] dark:bg-amber-400/[0.08] border-amber-200/50 dark:border-amber-500/20",
		}
	}
	return {
		badge: "border-oklch(0.88 0 0) bg-oklch(0.96 0 0) text-oklch(0.4 0 0) dark:border-oklch(1 0 0 / 12%) dark:bg-oklch(0.22 0 0) dark:text-oklch(0.75 0 0)",
		cardTint:
			"bg-oklch(0.985 0 0) dark:bg-oklch(0.18 0 0) border-oklch(0.92 0 0) dark:border-oklch(1 0 0 / 10%)",
	}
}

function changeLabel(changeType) {
	const t = String(changeType || "").toLowerCase()
	if (t === "new") return "New"
	return "Updated"
}

function changeStyles(changeType) {
	const t = String(changeType || "").toLowerCase()
	if (t === "new") {
		return "border-emerald-200/80 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
	}
	return "border-sky-200/80 bg-sky-500/10 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-200"
}

function ExecutiveSummaryCard({ executiveSummary }) {
	const stats = parseExecutiveStats(executiveSummary)
	const chips = themeChips(stats.themesLine)

	return (
		<section className="space-y-3">
			<div className="text-oklch(0.2 0 0) dark:text-oklch(0.95 0 0) flex items-center gap-2 text-sm font-semibold tracking-tight">
				<div className="bg-oklch(0.97 0 0) ring-oklch(0.92 0 0) dark:bg-oklch(0.22 0 0) dark:ring-oklch(1 0 0 / 10%) flex size-8 items-center justify-center rounded-lg shadow-sm ring-1">
					<LayoutDashboard className="text-oklch(0.45 0 0) dark:text-oklch(0.7 0 0) size-4" />
				</div>
				Executive summary
			</div>

			<div className="border-oklch(0.92 0 0) bg-oklch(1 0 0) dark:border-oklch(1 0 0 / 10%) dark:bg-oklch(0.16 0 0) rounded-xl border p-4 shadow-sm">
				<div className="flex flex-wrap gap-2">
					{stats.sources != null ? (
						<Badge
							variant="secondary"
							className="border-oklch(0.9 0 0) bg-oklch(0.97 0 0) dark:border-oklch(1 0 0 / 12%) dark:bg-oklch(0.22 0 0) rounded-full px-2.5 py-0.5 font-medium"
						>
							{stats.sources} sources
						</Badge>
					) : null}
					{stats.newUrls != null ? (
						<Badge
							variant="secondary"
							className="border-oklch(0.9 0 0) bg-oklch(0.97 0 0) dark:border-oklch(1 0 0 / 12%) dark:bg-oklch(0.22 0 0) rounded-full px-2.5 py-0.5 font-medium"
						>
							{stats.newUrls} new URLs
						</Badge>
					) : null}
					<Badge
						variant="outline"
						className="rounded-full px-2.5 py-0.5"
					>
						<Sparkles className="size-3" />
						AI digest
					</Badge>
				</div>

				{chips.length ? (
					<div className="mt-3 flex flex-wrap gap-1.5">
						{chips.map((chip, i) => (
							<span
								key={`${chip}-${i}`}
								className="border-oklch(0.92 0 0) bg-oklch(0.985 0 0) text-oklch(0.35 0 0) dark:border-oklch(1 0 0 / 10%) dark:bg-oklch(0.2 0 0) dark:text-oklch(0.78 0 0) inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
							>
								{chip}
							</span>
						))}
					</div>
				) : null}

				<p className="text-oklch(0.38 0 0) dark:text-oklch(0.72 0 0) mt-3 text-sm leading-relaxed">
					{stats.raw || "No summary available."}
				</p>
			</div>
		</section>
	)
}

function FindingCard({ finding }) {
	const { badge: priBadge, cardTint } = priorityStyles(finding.score)
	const host = (() => {
		try {
			return new URL(finding.url).hostname.replace(/^www\./, "")
		} catch {
			return finding.url || ""
		}
	})()

	return (
		<article
			className={cn(
				"group flex flex-col rounded-xl border p-4 shadow-sm transition-shadow duration-200 hover:shadow-md",
				cardTint
			)}
		>
			<div className="flex flex-wrap items-start justify-between gap-2">
				<h3 className="text-oklch(0.18 0 0) dark:text-oklch(0.96 0 0) min-w-0 flex-1 text-sm leading-snug font-semibold tracking-tight">
					{finding.title || "Untitled"}
				</h3>
				<div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
					<span
						className={cn(
							"inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
							priBadge
						)}
					>
						{finding.score || "LOW"}
					</span>
					<span
						className={cn(
							"inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
							changeStyles(finding.changeType)
						)}
					>
						{changeLabel(finding.changeType)}
					</span>
				</div>
			</div>

			<p className="text-oklch(0.5 0 0) dark:text-oklch(0.55 0 0) mt-1.5 flex items-center gap-1 text-xs">
				<span className="truncate">{host}</span>
				{finding.url ? (
					<a
						href={finding.url}
						target="_blank"
						rel="noopener noreferrer"
						className="text-oklch(0.45 0 0) hover:bg-oklch(0.95 0 0) dark:text-oklch(0.65 0 0) dark:hover:bg-oklch(0.25 0 0) inline-flex shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
						aria-label="Open source"
					>
						<ExternalLink className="size-3.5" />
					</a>
				) : null}
			</p>

			<p className="text-oklch(0.38 0 0) dark:text-oklch(0.72 0 0) mt-2 line-clamp-3 text-sm leading-relaxed">
				{finding.summary || "—"}
			</p>
		</article>
	)
}

function RecommendationsList({ items }) {
	if (!items?.length) return null

	return (
		<section className="space-y-3">
			<div className="text-oklch(0.2 0 0) dark:text-oklch(0.95 0 0) flex items-center gap-2 text-sm font-semibold tracking-tight">
				<div className="bg-oklch(0.97 0 0) ring-oklch(0.92 0 0) dark:bg-oklch(0.22 0 0) dark:ring-oklch(1 0 0 / 10%) flex size-8 items-center justify-center rounded-lg shadow-sm ring-1">
					<ListChecks className="text-oklch(0.45 0 0) dark:text-oklch(0.7 0 0) size-4" />
				</div>
				Recommendations
			</div>

			<ul className="space-y-2">
				{items.map((rec, i) => (
					<li
						key={i}
						className="border-oklch(0.92 0 0) bg-oklch(0.995 0 0) hover:bg-oklch(0.99 0 0) dark:border-oklch(1 0 0 / 10%) dark:bg-oklch(0.17 0 0) dark:hover:bg-oklch(0.19 0 0) flex gap-3 rounded-xl border p-3 shadow-sm transition-colors"
					>
						<span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
							<CheckCircle2 className="size-4" />
						</span>
						<p className="text-oklch(0.35 0 0) dark:text-oklch(0.78 0 0) text-sm leading-relaxed">
							{rec}
						</p>
					</li>
				))}
			</ul>
		</section>
	)
}

/**
 * SaaS-style intelligence report: executive summary, findings grid, recommendations.
 */
export function IntelligenceReportDashboard({
	executiveSummary,
	topFindings = [],
	recommendations = [],
	projectName,
	onRunScan,
	running = false,
	loading = false,
}) {
	return (
		<div className="mx-auto w-full max-w-5xl space-y-8 pb-8">
			<div className="border-oklch(0.92 0 0) bg-oklch(0.99 0 0)/90 dark:border-oklch(1 0 0 / 10%) dark:bg-oklch(0.14 0 0)/90 sticky top-0 z-10 -mx-1 border-b px-1 py-3 backdrop-blur-md">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="min-w-0">
						<p className="text-oklch(0.5 0 0) dark:text-oklch(0.55 0 0) text-[11px] font-medium tracking-wider uppercase">
							Active project
						</p>
						<p className="text-oklch(0.15 0 0) dark:text-oklch(0.98 0 0) truncate text-base font-semibold tracking-tight">
							{projectName || "Select a project"}
						</p>
					</div>
					<Button
						type="button"
						size="sm"
						className="shrink-0 shadow-sm"
						disabled={!onRunScan || running || loading}
						onClick={onRunScan}
					>
						{running ? "Running…" : "Run scan"}
					</Button>
				</div>
			</div>

			{loading ? (
				<p className="text-oklch(0.45 0 0) dark:text-oklch(0.65 0 0) text-sm">
					Loading report…
				</p>
			) : !executiveSummary && !topFindings?.length ? (
				<div className="border-oklch(0.9 0 0) bg-oklch(0.99 0 0) dark:border-oklch(1 0 0 / 12%) dark:bg-oklch(0.16 0 0) flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
					<FileText className="text-oklch(0.75 0 0) dark:text-oklch(0.4 0 0) mb-3 size-10" />
					<p className="text-oklch(0.45 0 0) dark:text-oklch(0.65 0 0) max-w-sm text-sm">
						No report yet. Run a scan to generate intelligence from
						the web.
					</p>
				</div>
			) : (
				<>
					<ExecutiveSummaryCard executiveSummary={executiveSummary} />

					<Separator className="my-2" />

					<section className="space-y-3">
						<div className="text-oklch(0.2 0 0) dark:text-oklch(0.95 0 0) flex items-center gap-2 text-sm font-semibold tracking-tight">
							<div className="bg-oklch(0.97 0 0) ring-oklch(0.92 0 0) dark:bg-oklch(0.22 0 0) dark:ring-oklch(1 0 0 / 10%) flex size-8 items-center justify-center rounded-lg shadow-sm ring-1">
								<FileText className="text-oklch(0.45 0 0) dark:text-oklch(0.7 0 0) size-4" />
							</div>
							Top findings
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							{topFindings.map((f, i) => (
								<FindingCard
									key={`${f.url}-${i}`}
									finding={f}
								/>
							))}
						</div>
					</section>

					{recommendations?.length ? (
						<>
							<Separator className="my-2" />
							<RecommendationsList items={recommendations} />
						</>
					) : null}
				</>
			)}
		</div>
	)
}

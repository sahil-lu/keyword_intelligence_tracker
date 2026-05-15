"use client"

import { useRadarStore } from "@/stores/radar-store"
import { Badge } from "@/ui/badge"
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/ui/chart"
import { Separator } from "@/ui/separator"
import { Skeleton } from "@/ui/skeleton"
import { cn } from "@/lib/utils"
import {
	AlertTriangle,
	ArrowRight,
	ExternalLink,
	FileText,
	Globe,
	ListChecks,
	Shield,
	Sparkles,
	Target,
	TrendingDown,
	TrendingUp,
	Zap,
} from "lucide-react"
import { useEffect, useMemo } from "react"
import {
	PieChart,
	Pie,
	Cell,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	LineChart,
	Line,
	CartesianGrid,
} from "recharts"

const AGENT_CONFIG = {
	jobs: {
		label: "Jobs",
		color: "bg-blue-500",
		hex: "#3b82f6",
		textColor: "text-blue-700 dark:text-blue-300",
		bgColor: "bg-blue-50 dark:bg-blue-500/10",
		borderColor: "border-blue-200 dark:border-blue-500/30",
		icon: Target,
	},
	skills: {
		label: "Skills",
		color: "bg-violet-500",
		hex: "#8b5cf6",
		textColor: "text-violet-700 dark:text-violet-300",
		bgColor: "bg-violet-50 dark:bg-violet-500/10",
		borderColor: "border-violet-200 dark:border-violet-500/30",
		icon: Zap,
	},
	policy: {
		label: "Policy",
		color: "bg-amber-500",
		hex: "#f59e0b",
		textColor: "text-amber-700 dark:text-amber-300",
		bgColor: "bg-amber-50 dark:bg-amber-500/10",
		borderColor: "border-amber-200 dark:border-amber-500/30",
		icon: Shield,
	},
	program: {
		label: "Program",
		color: "bg-emerald-500",
		hex: "#10b981",
		textColor: "text-emerald-700 dark:text-emerald-300",
		bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
		borderColor: "border-emerald-200 dark:border-emerald-500/30",
		icon: FileText,
	},
	competitor: {
		label: "Competitor",
		color: "bg-red-500",
		hex: "#ef4444",
		textColor: "text-red-700 dark:text-red-300",
		bgColor: "bg-red-50 dark:bg-red-500/10",
		borderColor: "border-red-200 dark:border-red-500/30",
		icon: TrendingUp,
	},
	other: {
		label: "Other",
		color: "bg-zinc-500",
		hex: "#71717a",
		textColor: "text-zinc-600 dark:text-zinc-400",
		bgColor: "bg-zinc-50 dark:bg-zinc-800",
		borderColor: "border-zinc-200 dark:border-zinc-700",
		icon: Globe,
	},
}

const PRIORITY_COLORS = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#a1a1aa" }

const priorityChartConfig = {
	high: {
		label: "High",
		color: PRIORITY_COLORS.HIGH,
	},
	medium: {
		label: "Medium",
		color: PRIORITY_COLORS.MEDIUM,
	},
	low: {
		label: "Low",
		color: PRIORITY_COLORS.LOW,
	},
}

const agentChartConfig = {
	value: {
		label: "Signals",
	},
}

const trendChartConfig = {
	total: {
		label: "Total",
		color: "#71717a",
	},
	high: {
		label: "High",
		color: PRIORITY_COLORS.HIGH,
	},
	medium: {
		label: "Medium",
		color: PRIORITY_COLORS.MEDIUM,
	},
}

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

function confidenceColor(score) {
	if (score >= 0.7) return "bg-emerald-500"
	if (score >= 0.4) return "bg-amber-500"
	return "bg-red-400"
}

function StatChip({ icon: Icon, label, value, accent, onClick, sub }) {
	const Comp = onClick ? "button" : "div"
	return (
		<Comp
			type={onClick ? "button" : undefined}
			onClick={onClick}
			className={cn(
				"group flex h-full w-full items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm shadow-zinc-950/3 transition-all",
				onClick &&
					"cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-950/6",
				accent ||
					"border-zinc-200/80 bg-white/90 dark:border-zinc-800/80 dark:bg-zinc-950/70"
			)}
		>
			<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-zinc-950 group-hover:text-white dark:bg-zinc-900 dark:text-zinc-400 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950">
				<Icon className="size-4" />
			</div>
			<div className="text-left">
				<p className="text-xl leading-none font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
					{value}
				</p>
				<p className="mt-1 text-[11px] font-medium tracking-[0.12em] text-zinc-400 uppercase">
					{label}
				</p>
				{sub && <p className="text-[10px] text-zinc-400">{sub}</p>}
			</div>
		</Comp>
	)
}

function ReportSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex gap-3">
				{[1, 2, 3, 4, 5].map(i => (
					<Skeleton
						key={i}
						className="h-16 w-32 rounded-lg"
					/>
				))}
			</div>
			<Skeleton className="h-48 w-full rounded-xl" />
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
				Run a scan to generate your first intelligence report.
			</p>
		</div>
	)
}

function TopActionsPanel({ actions }) {
	if (!actions?.length) return null
	return (
		<section className="space-y-3">
			<SectionHeader
				icon={Zap}
				label="Top Actions This Week"
			/>
			<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
				{actions.map((a, i) => {
					const config = AGENT_CONFIG[a.agent] || AGENT_CONFIG.other
					return (
						<div
							key={i}
							className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
						>
							<div className="flex items-center justify-between">
								<span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
									{i + 1}
								</span>
								<span
									className={cn(
										"rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase",
										config.bgColor,
										config.borderColor,
										config.textColor
									)}
								>
									{config.label}
								</span>
							</div>
							<p className="mt-3 text-sm leading-snug font-semibold text-zinc-900 dark:text-zinc-50">
								{a.action}
							</p>
							<p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
								{a.why}
							</p>
							<div className="mt-auto flex items-center justify-between pt-3">
								<div className="flex items-center gap-1.5">
									<div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
										<div
											className={cn(
												"h-full rounded-full",
												confidenceColor(
													a.confidence_score
												)
											)}
											style={{
												width: `${Math.round(a.confidence_score * 100)}%`,
											}}
										/>
									</div>
									<span className="text-[10px] text-zinc-400">
										{Math.round(a.confidence_score * 100)}%
									</span>
								</div>
								{a.source && (
									<a
										href={a.source}
										target="_blank"
										rel="noopener noreferrer"
										className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
									>
										{hostOf(a.source)}
									</a>
								)}
							</div>
						</div>
					)
				})}
			</div>
		</section>
	)
}

function PriorityDonut({ stats, onSliceClick }) {
	const data = useMemo(
		() =>
			[
				{
					name: "High",
					value: stats.high || 0,
					priority: "HIGH",
					fill: "var(--color-high)",
				},
				{
					name: "Medium",
					value: stats.medium || 0,
					priority: "MEDIUM",
					fill: "var(--color-medium)",
				},
				{
					name: "Low",
					value: stats.low || 0,
					priority: "LOW",
					fill: "var(--color-low)",
				},
			].filter(d => d.value > 0),
		[stats]
	)

	if (data.length === 0) return null
	const total = data.reduce((s, d) => s + d.value, 0)
	const colors = [
		PRIORITY_COLORS.HIGH,
		PRIORITY_COLORS.MEDIUM,
		PRIORITY_COLORS.LOW,
	]

	return (
		<div className="flex flex-col items-center">
			<p className="mb-2 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
				Priority Split
			</p>
			<div className="relative">
				<ChartContainer
					config={priorityChartConfig}
					className="mx-auto size-[140px]"
				>
					<PieChart>
						<Pie
							data={data}
							cx="50%"
							cy="50%"
							innerRadius={42}
							outerRadius={62}
							paddingAngle={3}
							dataKey="value"
							strokeWidth={0}
							style={{ cursor: "pointer" }}
							onClick={(_, idx) =>
								onSliceClick?.(data[idx]?.priority)
							}
						>
							{data.map(d => (
								<Cell
									key={d.priority}
									fill={d.fill}
								/>
							))}
						</Pie>
						<ChartTooltip
							content={
								<ChartTooltipContent
									hideLabel
									nameKey="name"
								/>
							}
						/>
					</PieChart>
				</ChartContainer>
				<div className="absolute inset-0 flex flex-col items-center justify-center">
					<span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
						{total}
					</span>
					<span className="text-[10px] text-zinc-400">total</span>
				</div>
			</div>
			<div className="mt-2 flex gap-3">
				{data.map((d, i) => (
					<button
						type="button"
						key={d.name}
						onClick={() => onSliceClick?.(d.priority)}
						className="flex cursor-pointer items-center gap-1 hover:opacity-70"
					>
						<span
							className="size-2 rounded-full"
							style={{ backgroundColor: colors[i] }}
						/>
						<span className="text-[10px] text-zinc-500">
							{d.name} ({d.value})
						</span>
					</button>
				))}
			</div>
		</div>
	)
}

function AgentBarChart({ agentSummary }) {
	const data = useMemo(
		() =>
			(agentSummary || [])
				.filter(a => a.agent !== "other")
				.map(a => ({
					name: (AGENT_CONFIG[a.agent] || AGENT_CONFIG.other).label,
					value: a.count,
					fill: (AGENT_CONFIG[a.agent] || AGENT_CONFIG.other).hex,
				})),
		[agentSummary]
	)

	if (data.length === 0) return null
	return (
		<div className="flex flex-col">
			<p className="mb-2 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
				Signals by Agent
			</p>
			<ChartContainer
				config={agentChartConfig}
				className="h-[160px] w-full"
			>
				<BarChart
					data={data}
					layout="vertical"
					margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
					barCategoryGap="20%"
				>
					<XAxis
						type="number"
						hide
					/>
					<YAxis
						type="category"
						dataKey="name"
						width={80}
						tick={{ fontSize: 11, fill: "#71717a" }}
						axisLine={false}
						tickLine={false}
					/>
					<ChartTooltip
						content={
							<ChartTooltipContent
								labelFormatter={(_, payload) =>
									payload?.[0]?.payload?.name
								}
							/>
						}
					/>
					<Bar
						dataKey="value"
						radius={[0, 4, 4, 0]}
						barSize={18}
					>
						{data.map((d, i) => (
							<Cell
								key={i}
								fill={d.fill}
							/>
						))}
					</Bar>
				</BarChart>
			</ChartContainer>
		</div>
	)
}

function TrendChart({ trends }) {
	const data = useMemo(() => {
		if (!trends?.length) return []
		return trends.map((t, i) => ({
			name: `Run ${i + 1}`,
			total: t.total || 0,
			high: t.high || 0,
			medium: t.medium || 0,
		}))
	}, [trends])

	if (data.length < 2) return null

	return (
		<section className="space-y-3">
			<SectionHeader
				icon={TrendingUp}
				label="Signal Trends"
			/>
			<div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<ChartContainer
					config={trendChartConfig}
					className="h-[200px] w-full"
				>
					<LineChart
						data={data}
						margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
					>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="#e4e4e7"
						/>
						<XAxis
							dataKey="name"
							tick={{ fontSize: 10, fill: "#71717a" }}
						/>
						<YAxis tick={{ fontSize: 10, fill: "#71717a" }} />
						<ChartTooltip
							content={<ChartTooltipContent indicator="line" />}
						/>
						<ChartLegend content={<ChartLegendContent />} />
						<Line
							type="monotone"
							dataKey="total"
							stroke="var(--color-total)"
							strokeWidth={2}
							dot={{ r: 3 }}
						/>
						<Line
							type="monotone"
							dataKey="high"
							stroke="var(--color-high)"
							strokeWidth={2}
							dot={{ r: 3 }}
						/>
						<Line
							type="monotone"
							dataKey="medium"
							stroke="var(--color-medium)"
							strokeWidth={1.5}
							dot={{ r: 2 }}
						/>
					</LineChart>
				</ChartContainer>
			</div>
		</section>
	)
}

function DeltaInsights({ delta }) {
	if (!delta) return null
	const changes = delta.agent_changes || []
	if (changes.length === 0 && delta.high_diff === 0) return null

	return (
		<section className="space-y-3">
			<SectionHeader
				icon={TrendingUp}
				label="What Changed vs Last Run"
			/>
			<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<div className="flex flex-wrap gap-3">
					{delta.high_diff !== 0 && (
						<DeltaChip
							label="High Priority"
							diff={delta.high_diff}
							from={delta.high_previous}
							to={delta.high_current}
						/>
					)}
					{delta.total_diff !== 0 && (
						<DeltaChip
							label="Total Signals"
							diff={delta.total_diff}
							from={delta.total_previous}
							to={delta.total_current}
						/>
					)}
					{changes.slice(0, 4).map(c => (
						<DeltaChip
							key={c.agent}
							label={c.label}
							diff={c.diff}
							from={c.previous}
							to={c.current}
							pct={c.pct}
						/>
					))}
				</div>
			</div>
		</section>
	)
}

function DeltaChip({ label, diff, from, to, pct }) {
	const isUp = diff > 0
	const Icon = isUp ? TrendingUp : TrendingDown
	return (
		<div
			className={cn(
				"flex items-center gap-2 rounded-lg border px-3 py-2",
				isUp
					? "border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5"
					: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5"
			)}
		>
			<Icon
				className={cn(
					"size-3.5",
					isUp ? "text-red-500" : "text-emerald-500"
				)}
			/>
			<div>
				<p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
					{label}
				</p>
				<p className="text-[10px] text-zinc-500">
					{from} → {to} ({isUp ? "+" : ""}
					{diff}
					{pct !== undefined ? `, ${isUp ? "+" : ""}${pct}%` : ""})
				</p>
			</div>
		</div>
	)
}

function AgentGrid({ agentSummary, onAgentClick }) {
	const agents = (agentSummary || []).filter(a => a.agent !== "other")
	if (agents.length === 0) return null
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
			{agents.map(a => {
				const config = AGENT_CONFIG[a.agent] || AGENT_CONFIG.other
				const Icon = config.icon
				const total = a.count || 0
				const high = a.high_count || 0
				const pct = total > 0 ? Math.round((high / total) * 100) : 0
				return (
					<button
						type="button"
						key={a.agent}
						onClick={() => onAgentClick?.(a.agent)}
						className={cn(
							"flex cursor-pointer flex-col rounded-xl border p-3 text-left transition-shadow hover:shadow-md",
							config.borderColor,
							"bg-white dark:bg-zinc-900"
						)}
					>
						<div className="flex items-center gap-2">
							<div
								className={cn(
									"flex size-7 items-center justify-center rounded-lg border",
									config.bgColor,
									config.borderColor
								)}
							>
								<Icon
									className={cn("size-3.5", config.textColor)}
								/>
							</div>
							<span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
								{config.label}
							</span>
						</div>
						<p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
							{total}
						</p>
						<p className="text-[10px] text-zinc-400">
							signal{total !== 1 ? "s" : ""} detected
						</p>
						<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
							{total > 0 && (
								<div
									className="h-full rounded-full bg-red-500 transition-all"
									style={{ width: `${pct}%` }}
								/>
							)}
						</div>
						<p className="mt-0.5 text-[10px] text-zinc-400">
							{high > 0
								? `${high} high priority (${pct}%)`
								: "No high priority"}
						</p>
						{a.top_signal && (
							<p className="mt-2 line-clamp-1 border-t border-zinc-100 pt-2 text-[11px] text-zinc-500 dark:border-zinc-800">
								{a.top_signal.title}
							</p>
						)}
					</button>
				)
			})}
		</div>
	)
}

function AgentBadge({ agent }) {
	const config = AGENT_CONFIG[agent] || AGENT_CONFIG.other
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase",
				config.bgColor,
				config.borderColor,
				config.textColor
			)}
		>
			<span className={cn("size-1.5 rounded-full", config.color)} />
			{config.label}
		</span>
	)
}

function SignalCard({ signal }) {
	const s = signal
	const conf = s.confidence_score || 0
	return (
		<article className="group flex flex-col rounded-3xl border border-zinc-200/80 bg-white/90 p-5 shadow-xl shadow-zinc-950/4 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-zinc-950/8 dark:border-zinc-800/80 dark:bg-zinc-950/70">
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-center gap-2">
					<AgentBadge agent={s.agent} />
					<Badge
						variant="outline"
						className={cn(
							"text-[10px] uppercase",
							priorityColor(s.priority)
						)}
					>
						{s.priority}
					</Badge>
				</div>
				<div className="flex items-center gap-2">
					<div
						className="flex items-center gap-1"
						title={`Confidence: ${Math.round(conf * 100)}%`}
					>
						<div className="h-1.5 w-10 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
							<div
								className={cn(
									"h-full rounded-full transition-all",
									confidenceColor(conf)
								)}
								style={{ width: `${Math.round(conf * 100)}%` }}
							/>
						</div>
						<span className="text-[9px] text-zinc-400">
							{Math.round(conf * 100)}%
						</span>
					</div>
					{s.url && (
						<a
							href={s.url}
							target="_blank"
							rel="noopener noreferrer"
							className="rounded p-1 text-zinc-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
						>
							<ExternalLink className="size-3.5" />
						</a>
					)}
				</div>
			</div>
			<h3 className="mt-2 text-sm leading-snug font-semibold text-zinc-900 dark:text-zinc-50">
				{s.title || "Untitled"}
			</h3>
			<div className="mt-3 space-y-2">
				<div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
					<p className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
						What Changed
					</p>
					<p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
						{s.what_changed}
					</p>
				</div>
				<div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3 dark:border-amber-500/20 dark:bg-amber-500/5">
					<p className="text-[10px] font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-400">
						Impact on ITM
					</p>
					<p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-200">
						{s.impact_on_itm}
					</p>
				</div>
				<div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/5">
					<p className="text-[10px] font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
						Recommended Action
					</p>
					<p className="mt-1 flex items-start gap-1.5 text-sm leading-relaxed font-medium text-emerald-800 dark:text-emerald-200">
						<ArrowRight className="mt-0.5 size-3.5 shrink-0" />
						{s.recommended_action}
					</p>
				</div>
			</div>
			<div className="mt-auto flex items-center justify-between pt-3">
				<span className="truncate text-[11px] text-zinc-400">
					{hostOf(s.url)}
				</span>
			</div>
		</article>
	)
}

function buildReportBrief(report) {
	const summarySentences = (report.executive_summary || "")
		.split(/(?<=[.!?])\s+/)
		.map(item => item.trim())
		.filter(Boolean)
	const actionPointers = (report.top_actions || [])
		.map(action => action.action)
		.filter(Boolean)
	const signalPointers = (report.top_findings || [])
		.map(signal => signal.recommended_action || signal.title)
		.filter(Boolean)
	const recommendationPointers = (report.recommendations || [])
		.map(rec => rec.action || rec)
		.filter(Boolean)

	const pointers = [
		...summarySentences.slice(0, 2),
		...actionPointers,
		...signalPointers,
		...recommendationPointers,
	]

	return [...new Set(pointers)].slice(0, 6)
}

function ReportSummaryPanel({ report }) {
	const brief = buildReportBrief(report)

	return (
		<aside className="xl:sticky xl:top-5 xl:self-start">
			<div className="max-h-[560px] space-y-5 overflow-y-auto overscroll-contain rounded-3xl border border-zinc-200/80 bg-white/90 p-5 shadow-xl shadow-zinc-950/4 backdrop-blur xl:max-h-[calc(100dvh-170px)] dark:border-zinc-800/80 dark:bg-zinc-950/70">
				<div>
					<p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
						Report Brief
					</p>
					<h2 className="mt-2 text-lg leading-tight font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
						Key takeaways for this project
					</h2>
				</div>

				<ul className="space-y-3">
					{brief.map((item, i) => (
						<li
							key={`${item}-${i}`}
							className="flex gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3 text-sm leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200"
						>
							<span className="mt-2 size-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
							<span className="line-clamp-3">{item}</span>
						</li>
					))}
					{brief.length === 0 && (
						<li className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
							Run a scan to generate a short report brief.
						</li>
					)}
				</ul>
			</div>
		</aside>
	)
}

export function ReportView() {
	const {
		report,
		reportLoading,
		selectedProjectId,
		fetchReport,
		navigateToSignals,
		trends,
	} = useRadarStore()

	useEffect(() => {
		if (selectedProjectId) fetchReport()
	}, [selectedProjectId, fetchReport])

	const goToSignals = (filter = {}) => navigateToSignals(filter)

	if (reportLoading)
		return (
			<div className="mx-auto max-w-5xl p-6">
				<ReportSkeleton />
			</div>
		)

	const r = report?.report
	if (!r)
		return (
			<div className="mx-auto max-w-5xl p-6">
				<EmptyReport />
			</div>
		)

	const stats = r.stats || {}

	return (
		<div className="w-full p-7 pb-14">
			<div className="grid w-full grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
				<div className="min-w-0 space-y-8">
					<div>
						<p className="text-xs font-semibold tracking-[0.2em] text-zinc-400 uppercase">
							Combined Intelligence Report
						</p>
					</div>

					{/* Stat chips */}
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
						<StatChip
							icon={Globe}
							label="Total signals"
							value={stats.total ?? "—"}
							onClick={() => goToSignals()}
						/>
						<StatChip
							icon={TrendingUp}
							label="New"
							value={stats.new ?? "—"}
							onClick={() => goToSignals({ change_type: "new" })}
						/>
						<StatChip
							icon={AlertTriangle}
							label="High priority"
							value={stats.high ?? "—"}
							accent="border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5"
							onClick={() => goToSignals({ priority: "HIGH" })}
						/>
						<StatChip
							icon={Shield}
							label="Discarded"
							value={stats.discarded ?? "—"}
							accent="border-zinc-300 bg-zinc-100/50 dark:border-zinc-600 dark:bg-zinc-800/50"
						/>
						<StatChip
							icon={Target}
							label="Avg Confidence"
							value={
								stats.avg_confidence
									? `${Math.round(stats.avg_confidence * 100)}%`
									: "—"
							}
						/>
					</div>

					{/* Charts */}
					<section className="rounded-3xl border border-zinc-200/80 bg-white/90 p-6 shadow-xl shadow-zinc-950/4 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/70">
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<PriorityDonut
								stats={stats}
								onSliceClick={p => goToSignals({ priority: p })}
							/>
							<AgentBarChart agentSummary={r.agent_summary} />
						</div>
					</section>

					{/* Top 3 Actions */}
					<TopActionsPanel actions={r.top_actions} />

					{/* Executive summary */}
					<section className="space-y-3">
						<SectionHeader
							icon={Sparkles}
							label="What Should ITM Do?"
						/>
						<div className="rounded-3xl border border-zinc-200/80 bg-white/90 p-6 shadow-xl shadow-zinc-950/4 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/70">
							<p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
								{r.executive_summary}
							</p>
						</div>
					</section>

					{/* Delta insights */}
					<DeltaInsights delta={r.delta} />

					<Separator />

					{/* Agent grid */}
					{r.agent_summary?.length > 0 && (
						<section className="space-y-3">
							<SectionHeader
								icon={Target}
								label="Agent Overview"
							/>
							<AgentGrid
								agentSummary={r.agent_summary}
								onAgentClick={agent => goToSignals({ agent })}
							/>
						</section>
					)}

					<Separator />

					{/* Trend charts */}
					<TrendChart trends={trends} />

					{/* High priority signals */}
					{r.top_findings?.length > 0 && (
						<>
							<Separator />
							<section className="space-y-3">
								<SectionHeader
									icon={AlertTriangle}
									label="High Priority Signals"
								/>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									{r.top_findings.map((s, i) => (
										<SignalCard
											key={`${s.url}-${i}`}
											signal={s}
										/>
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
									label="Action Items"
								/>
								<ul className="space-y-2">
									{r.recommendations.map((rec, i) => (
										<li
											key={i}
											className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
										>
											<span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
												<ArrowRight className="size-3.5" />
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
											<div className="flex shrink-0 items-center gap-2 self-start">
												{rec.confidence_score > 0 && (
													<div
														className="flex items-center gap-1"
														title={`Confidence: ${Math.round(rec.confidence_score * 100)}%`}
													>
														<div className="h-1.5 w-8 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
															<div
																className={cn(
																	"h-full rounded-full",
																	confidenceColor(
																		rec.confidence_score
																	)
																)}
																style={{
																	width: `${Math.round(rec.confidence_score * 100)}%`,
																}}
															/>
														</div>
													</div>
												)}
												{rec.priority && (
													<Badge
														variant="outline"
														className={cn(
															"text-[10px]",
															priorityColor(
																rec.priority
															)
														)}
													>
														{rec.priority}
													</Badge>
												)}
											</div>
										</li>
									))}
								</ul>
							</section>
						</>
					)}
				</div>

				<ReportSummaryPanel report={r} />
			</div>
		</div>
	)
}

function SectionHeader({ icon: Icon, label }) {
	return (
		<div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
			<div className="flex size-8 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
				<Icon className="size-4 text-zinc-500" />
			</div>
			{label}
		</div>
	)
}

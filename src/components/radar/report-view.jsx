"use client"

import { useRadarStore } from "@/stores/radar-store"
import { Badge } from "@/ui/badge"
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
	Tooltip,
	ResponsiveContainer,
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

const PRIORITY_COLORS = {
	HIGH: "#ef4444",
	MEDIUM: "#f59e0b",
	LOW: "#a1a1aa",
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

function StatChip({ icon: Icon, label, value, accent, onClick }) {
	const Comp = onClick ? "button" : "div"
	return (
		<Comp
			type={onClick ? "button" : undefined}
			onClick={onClick}
			className={cn(
				"flex items-center gap-2 rounded-lg border px-3 py-2 transition-shadow",
				onClick && "cursor-pointer hover:shadow-md",
				accent ||
					"border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
			)}
		>
			<Icon className="size-4 shrink-0 text-zinc-400" />
			<div className="text-left">
				<p className="text-lg leading-none font-semibold text-zinc-900 dark:text-zinc-50">
					{value}
				</p>
				<p className="mt-0.5 text-[11px] text-zinc-500">{label}</p>
			</div>
		</Comp>
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

function CustomTooltip({ active, payload }) {
	if (!active || !payload?.length) return null
	const d = payload[0].payload
	return (
		<div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
			<p className="font-semibold text-zinc-900 dark:text-zinc-50">
				{d.name}
			</p>
			<p className="text-zinc-500">{d.value} signals</p>
		</div>
	)
}

function PriorityDonut({ stats }) {
	const data = useMemo(
		() =>
			[
				{ name: "High", value: stats.high || 0 },
				{ name: "Medium", value: stats.medium || 0 },
				{ name: "Low", value: stats.low || 0 },
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
				<ResponsiveContainer
					width={140}
					height={140}
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
						>
							{data.map((_, i) => (
								<Cell
									key={i}
									fill={colors[i]}
								/>
							))}
						</Pie>
						<Tooltip content={<CustomTooltip />} />
					</PieChart>
				</ResponsiveContainer>
				<div className="absolute inset-0 flex flex-col items-center justify-center">
					<span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
						{total}
					</span>
					<span className="text-[10px] text-zinc-400">total</span>
				</div>
			</div>
			<div className="mt-2 flex gap-3">
				{data.map((d, i) => (
					<div
						key={d.name}
						className="flex items-center gap-1"
					>
						<span
							className="size-2 rounded-full"
							style={{ backgroundColor: colors[i] }}
						/>
						<span className="text-[10px] text-zinc-500">
							{d.name} ({d.value})
						</span>
					</div>
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
			<ResponsiveContainer
				width="100%"
				height={160}
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
					<Tooltip content={<CustomTooltip />} />
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
			</ResponsiveContainer>
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

						{/* Priority bar */}
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
	return (
		<article className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
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

			<h3 className="mt-2 text-sm leading-snug font-semibold text-zinc-900 dark:text-zinc-50">
				{s.title || "Untitled"}
			</h3>

			<div className="mt-3 space-y-2">
				<div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/50">
					<p className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
						What Changed
					</p>
					<p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
						{s.what_changed}
					</p>
				</div>

				<div className="rounded-lg border border-amber-100 bg-amber-50/50 p-2.5 dark:border-amber-500/20 dark:bg-amber-500/5">
					<p className="text-[10px] font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-400">
						Impact on ITM
					</p>
					<p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-200">
						{s.impact_on_itm}
					</p>
				</div>

				<div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-2.5 dark:border-emerald-500/20 dark:bg-emerald-500/5">
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

export function ReportView() {
	const {
		report,
		reportLoading,
		selectedProjectId,
		fetchReport,
		navigateToSignals,
	} = useRadarStore()

	useEffect(() => {
		if (selectedProjectId) fetchReport()
	}, [selectedProjectId, fetchReport])

	const goToSignals = (filter = {}) => navigateToSignals(filter)

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
			</div>

			{/* Visual overview — charts */}
			<section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<PriorityDonut stats={stats} />
					<AgentBarChart agentSummary={r.agent_summary} />
				</div>
			</section>

			{/* Executive summary */}
			<section className="space-y-3">
				<SectionHeader
					icon={Sparkles}
					label="What Should ITM Do?"
				/>
				<div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
					<p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
						{r.executive_summary}
					</p>
				</div>
			</section>

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

			{/* High priority signals */}
			{r.top_findings?.length > 0 && (
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

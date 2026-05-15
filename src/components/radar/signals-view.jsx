"use client"

import { useRadarStore } from "@/stores/radar-store"
import { Badge } from "@/ui/badge"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/ui/dialog"
import { Skeleton } from "@/ui/skeleton"
import { cn } from "@/lib/utils"
import { ArrowDown, ArrowUp, ExternalLink, EyeOff, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

const PRIORITIES = ["ALL", "HIGH", "MEDIUM", "LOW"]
const CHANGE_TYPES = ["ALL", "new", "updated", "existing"]
const AGENTS = [
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

function agentLabel(agent) {
	return AGENTS.find(a => a.key === agent)?.label || "All"
}

function faviconUrl(url) {
	try {
		const host = new URL(url).hostname
		return `https://www.google.com/s2/favicons?domain=${host}&sz=32`
	} catch {
		return null
	}
}

function Favicon({ url }) {
	const favicon = faviconUrl(url)
	if (!favicon) return null

	return (
		<span
			aria-hidden="true"
			className="size-4 shrink-0 rounded-sm bg-zinc-100 bg-cover bg-center dark:bg-zinc-800"
			style={{ backgroundImage: `url(${favicon})` }}
		/>
	)
}

function confidenceColor(score) {
	if (score >= 0.7) return "bg-emerald-500"
	if (score >= 0.4) return "bg-amber-500"
	return "bg-red-400"
}

function FilterSelect({ label, value, options, onChange }) {
	return (
		<label className="flex items-center gap-2 text-xs font-medium text-zinc-500">
			<span className="sr-only">{label}</span>
			<select
				value={value}
				onChange={e => onChange(e.target.value)}
				className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 transition-colors outline-none hover:border-zinc-300 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700"
			>
				{options.map(option => (
					<option
						key={option.value}
						value={option.value}
					>
						{option.label}
					</option>
				))}
			</select>
		</label>
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
		hideLow,
		toggleHideLow,
	} = useRadarStore()
	const [confidenceSort, setConfidenceSort] = useState("desc")
	const [selectedSignal, setSelectedSignal] = useState(null)

	useEffect(() => {
		if (selectedProjectId) fetchSignals()
	}, [selectedProjectId, fetchSignals])

	const activePriority = signalsFilter.priority || "ALL"
	const activeChangeType = signalsFilter.change_type || "ALL"
	const activeAgent = signalsFilter.agent || "ALL"

	const filtered = useMemo(() => {
		if (!hideLow || activePriority === "LOW") return signals
		return signals.filter(s => s.priority !== "LOW")
	}, [signals, hideLow, activePriority])

	const sortedSignals = useMemo(() => {
		return [...filtered].sort((a, b) => {
			const aScore = a.confidence_score || 0
			const bScore = b.confidence_score || 0
			return confidenceSort === "asc" ? aScore - bScore : bScore - aScore
		})
	}, [filtered, confidenceSort])

	const lowCount = signals.filter(s => s.priority === "LOW").length

	return (
		<div className="w-full space-y-5 px-0 pb-14">
			<div className="mx-7 flex flex-wrap items-center justify-between gap-4">
				<div>
					<p className="text-xs font-semibold tracking-[0.2em] text-zinc-400 uppercase">
						Signal intelligence
					</p>
					<h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
						<span>
							{activeAgent === "ALL"
								? "All strategic signals"
								: `${agentLabel(activeAgent)} signals`}
						</span>{" "}
						<span className="text-zinc-400">
							({filtered.length})
						</span>
					</h2>
				</div>
				<div className="flex flex-wrap items-center justify-end gap-3">
					<FilterSelect
						label="Priority"
						value={activePriority}
						options={PRIORITIES.map(p => ({
							value: p,
							label: p === "ALL" ? "All priorities" : p,
						}))}
						onChange={priority =>
							setSignalsFilter({
								priority: priority === "ALL" ? null : priority,
							})
						}
					/>
					<FilterSelect
						label="Change"
						value={activeChangeType}
						options={CHANGE_TYPES.map(c => ({
							value: c,
							label:
								c === "ALL" ? "All changes" : c.toUpperCase(),
						}))}
						onChange={changeType =>
							setSignalsFilter({
								change_type:
									changeType === "ALL" ? null : changeType,
							})
						}
					/>
					<button
						type="button"
						onClick={toggleHideLow}
						className={cn(
							"flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:-translate-y-0.5 hover:shadow-sm",
							hideLow
								? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
								: "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
						)}
					>
						<EyeOff className="size-3" />
						{hideLow ? `Hiding ${lowCount} low` : "Show all"}
					</button>
				</div>
			</div>

			{signalsLoading ? (
				<SignalsTableSkeleton />
			) : sortedSignals.length === 0 ? (
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
				<div className="w-full overflow-x-auto border-y border-zinc-200/80 bg-white/95 shadow-xl shadow-zinc-950/4 dark:border-zinc-800/80 dark:bg-zinc-950">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-zinc-100 bg-zinc-50/80 text-left text-xs font-semibold tracking-[0.12em] text-zinc-400 uppercase dark:border-zinc-800 dark:bg-zinc-900/60">
								<th className="px-4 py-2.5">Title</th>
								<th className="px-4 py-2.5">Agent</th>
								<th className="px-4 py-2.5">What Changed</th>
								<th className="px-4 py-2.5">Impact</th>
								<th className="px-4 py-2.5">Action</th>
								<th className="px-4 py-2.5">Priority</th>
								<th className="w-20 px-4 py-2.5">
									<button
										type="button"
										onClick={() =>
											setConfidenceSort(sort =>
												sort === "asc" ? "desc" : "asc"
											)
										}
										className="inline-flex items-center gap-1 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
										title={`Sort confidence ${confidenceSort === "asc" ? "descending" : "ascending"}`}
									>
										Conf.
										{confidenceSort === "asc" ? (
											<ArrowUp className="size-3" />
										) : (
											<ArrowDown className="size-3" />
										)}
									</button>
								</th>
								<th className="px-4 py-2.5">Source</th>
							</tr>
						</thead>
						<tbody>
							{sortedSignals.map((s, i) => {
								const conf = s.confidence_score || 0
								return (
									<tr
										key={s.id || i}
										onClick={() => setSelectedSignal(s)}
										className="cursor-pointer border-b border-zinc-100/70 transition-colors last:border-0 hover:bg-zinc-50/80 dark:border-zinc-800/60 dark:hover:bg-zinc-900/70"
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
											<div
												className="flex items-center gap-1"
												title={`${Math.round(conf * 100)}%`}
											>
												<div className="h-1.5 w-10 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
													<div
														className={cn(
															"h-full rounded-full",
															confidenceColor(
																conf
															)
														)}
														style={{
															width: `${Math.round(conf * 100)}%`,
														}}
													/>
												</div>
												<span className="text-[9px] text-zinc-400">
													{Math.round(conf * 100)}%
												</span>
											</div>
										</td>
										<td className="px-4 py-3">
											{s.url && (
												<a
													href={s.url}
													target="_blank"
													rel="noopener noreferrer"
													onClick={e =>
														e.stopPropagation()
													}
													className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
												>
													<Favicon url={s.url} />
													<span>{hostOf(s.url)}</span>
													<ExternalLink className="size-3" />
												</a>
											)}
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			)}
			<SignalDialog
				signal={selectedSignal}
				open={Boolean(selectedSignal)}
				onOpenChange={open => {
					if (!open) setSelectedSignal(null)
				}}
			/>
		</div>
	)
}

function SignalDialog({ signal, open, onOpenChange }) {
	if (!signal) return null
	const conf = signal.confidence_score || 0

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<DialogContent className="max-h-[84dvh] overflow-hidden border-0 bg-white p-0 shadow-2xl ring-0 sm:max-w-2xl dark:bg-zinc-950">
				<DialogHeader>
					<div className="border-b border-zinc-100 px-6 pt-6 pb-4 dark:border-zinc-800">
						<DialogTitle className="pr-10 text-2xl leading-tight font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
							{signal.title || "Untitled signal"}
						</DialogTitle>
						<DialogDescription asChild>
							<div className="mt-3 flex flex-wrap items-center gap-2">
								{signal.url && (
									<a
										href={signal.url}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
									>
										<Favicon url={signal.url} />
										{hostOf(signal.url)}
										<ExternalLink className="size-3" />
									</a>
								)}
								<Badge
									variant="outline"
									className={cn(
										"rounded-full px-2.5 py-1 text-[10px] uppercase",
										priorityColor(signal.priority)
									)}
								>
									{signal.priority}
								</Badge>
								<span
									className={cn(
										"inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase",
										AGENT_COLORS[signal.agent] ||
											AGENT_COLORS.other
									)}
								>
									{signal.agent}
								</span>
								{signal.change_type && (
									<span
										className={cn(
											"inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase",
											changeColor(signal.change_type)
										)}
									>
										{signal.change_type}
									</span>
								)}
							</div>
						</DialogDescription>
					</div>
				</DialogHeader>

				<div className="max-h-[calc(84dvh-132px)] space-y-4 overflow-y-auto p-6">
					<SignalDetailSection
						label="What Changed"
						value={signal.what_changed}
					/>
					<SignalDetailSection
						label="Impact on ITM"
						value={signal.impact_on_itm}
						className="border-amber-100 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-950"
					/>
					<SignalDetailSection
						label="Recommended Action"
						value={signal.recommended_action}
						className="border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-950"
					/>
					<div className="rounded-3xl bg-zinc-50 p-4 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800">
						<p className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
							Confidence
						</p>
						<div
							className="mt-2 flex items-center gap-2"
							title={`${Math.round(conf * 100)}%`}
						>
							<div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
								<div
									className={cn(
										"h-full rounded-full",
										confidenceColor(conf)
									)}
									style={{
										width: `${Math.round(conf * 100)}%`,
									}}
								/>
							</div>
							<span className="text-xs font-medium text-zinc-500">
								{Math.round(conf * 100)}%
							</span>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

function SignalDetailSection({ label, value, className }) {
	if (!value) return null

	return (
		<section
			className={cn(
				"rounded-3xl bg-zinc-50 p-4 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800",
				className
			)}
		>
			<p className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
				{label}
			</p>
			<p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
				{value}
			</p>
		</section>
	)
}

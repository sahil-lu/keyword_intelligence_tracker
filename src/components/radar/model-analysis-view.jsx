"use client"

import { useRadarStore } from "@/stores/radar-store"
import { Badge } from "@/ui/badge"
import { Skeleton } from "@/ui/skeleton"
import { cn } from "@/lib/utils"
import { Brain, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

const MODEL_OPTIONS = [
	{ key: "DEFAULT", label: "Default" },
	{ key: "OPENAI_DEEP_RESEARCH", label: "OpenAI Deep Research" },
	{ key: "GEMINI_DEEP_RESEARCH_MAX", label: "Gemini Deep Research Max" },
	{ key: "PERPLEXITY", label: "Perplexity" },
]

function priorityColor(priority) {
	if (priority === "HIGH")
		return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
	if (priority === "MEDIUM")
		return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
	return "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
}

export function ModelAnalysisView() {
	const {
		selectedProjectId,
		modelReports,
		modelReportsLoading,
		fetchModelReports,
	} = useRadarStore()
	const availableModels = Object.keys(modelReports || {})
	const [selectedModel, setSelectedModel] = useState("DEFAULT")

	useEffect(() => {
		if (selectedProjectId) fetchModelReports()
	}, [selectedProjectId, fetchModelReports])

	const effectiveSelectedModel =
		availableModels.length > 0 && !availableModels.includes(selectedModel)
			? availableModels[0]
			: selectedModel
	const selected = modelReports?.[effectiveSelectedModel]
	const report = selected?.report
	const label = useMemo(
		() =>
			MODEL_OPTIONS.find(model => model.key === effectiveSelectedModel)
				?.label || effectiveSelectedModel,
		[effectiveSelectedModel]
	)

	if (modelReportsLoading) {
		return (
			<div className="mx-auto max-w-5xl space-y-4 p-7">
				<Skeleton className="h-12 w-full rounded-2xl" />
				<Skeleton className="h-40 w-full rounded-3xl" />
				<Skeleton className="h-64 w-full rounded-3xl" />
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-6xl space-y-6 p-7 pb-14">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="flex size-9 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
						<Brain className="size-4 text-zinc-500" />
					</div>
					<div>
						<p className="text-xs font-semibold tracking-[0.2em] text-zinc-400 uppercase">
							Model Analysis
						</p>
						<h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
							{label}
						</h2>
					</div>
				</div>

				<select
					value={effectiveSelectedModel}
					onChange={e => setSelectedModel(e.target.value)}
					className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 transition-colors outline-none hover:border-zinc-300 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700"
				>
					{MODEL_OPTIONS.map(model => (
						<option
							key={model.key}
							value={model.key}
							disabled={!modelReports?.[model.key]}
						>
							{model.label}
						</option>
					))}
				</select>
			</div>

			{!report ? (
				<div className="rounded-3xl border border-dashed border-zinc-300 bg-white/80 p-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950/70">
					Run a scan with model analysis enabled to generate per-model
					reports.
				</div>
			) : (
				<>
					<section className="rounded-3xl border border-zinc-200/80 bg-white/90 p-6 shadow-xl shadow-zinc-950/4 dark:border-zinc-800/80 dark:bg-zinc-950/70">
						<div className="mb-3 flex items-center gap-2">
							<Sparkles className="size-4 text-zinc-400" />
							<h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
								Executive Summary
							</h3>
						</div>
						<p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
							{report.executive_summary}
						</p>
						{selected.status && selected.status !== "completed" && (
							<p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
								{selected.error}
							</p>
						)}
					</section>

					<section className="space-y-3">
						<h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
							Signals
						</h3>
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
							{(selected.signals || [])
								.slice(0, 10)
								.map((signal, i) => (
									<article
										key={`${signal.url}-${i}`}
										className="rounded-3xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70"
									>
										<div className="mb-2 flex flex-wrap items-center gap-2">
											<Badge
												variant="outline"
												className={cn(
													"rounded-full text-[10px]",
													priorityColor(
														signal.priority
													)
												)}
											>
												{signal.priority}
											</Badge>
											<span className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
												{signal.agent}
											</span>
										</div>
										<h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
											{signal.title}
										</h4>
										<p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
											{signal.what_changed}
										</p>
									</article>
								))}
						</div>
					</section>

					<section className="space-y-3">
						<h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
							Recommendations
						</h3>
						<ul className="space-y-2">
							{(report.recommendations || []).map((rec, i) => (
								<li
									key={i}
									className="rounded-2xl border border-zinc-200 bg-white p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
								>
									{rec.action || rec}
									{rec.context && (
										<p className="mt-1 text-xs text-zinc-400">
											{rec.context}
										</p>
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

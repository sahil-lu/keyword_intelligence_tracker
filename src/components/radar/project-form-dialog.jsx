"use client"

import { useRadarStore } from "@/stores/radar-store"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Label } from "@/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

const MODEL_OPTIONS = [
	{ key: "DEFAULT", label: "Default", locked: true },
	{ key: "OPENAI_DEEP_RESEARCH", label: "OpenAI Deep Research" },
	{ key: "GEMINI_DEEP_RESEARCH_MAX", label: "Gemini Deep Research Max" },
	{ key: "PERPLEXITY", label: "Perplexity" },
]

export function ProjectFormDialog({ onClose }) {
	const router = useRouter()
	const { createProject } = useRadarStore()
	const [name, setName] = useState("")
	const [keyword, setKeyword] = useState("")
	const [competitors, setCompetitors] = useState("")
	const [competitorDomains, setCompetitorDomains] = useState("")
	const [frequency, setFrequency] = useState("daily")
	const [selectedModels, setSelectedModels] = useState(["DEFAULT"])
	const [busy, setBusy] = useState(false)

	const toggleModel = model => {
		if (model === "DEFAULT") return
		setSelectedModels(current =>
			current.includes(model)
				? current.filter(item => item !== model)
				: [...current, model]
		)
	}

	const onSubmit = async e => {
		e.preventDefault()
		if (!name.trim() || !keyword.trim()) {
			toast.error("Name and keyword are required.")
			return
		}
		setBusy(true)
		try {
			const comp = competitors
				.split(",")
				.map(s => s.trim())
				.filter(Boolean)
			const domains = competitorDomains
				.split(",")
				.map(s =>
					s
						.trim()
						.replace(/^https?:\/\//, "")
						.replace(/\/.*$/, "")
				)
				.filter(Boolean)
			const created = await createProject({
				name: name.trim(),
				keyword: keyword.trim(),
				keywords: [keyword.trim()],
				selectedModels,
				competitors: comp,
				competitorDomains: domains,
				frequency,
			})
			toast.success("Project created")
			onClose()
			if (created?.id) router.push(`/project/${created.id}/report`)
		} catch (err) {
			toast.error(err.message || "Failed to create project")
		} finally {
			setBusy(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
						New Project
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
					>
						<X className="size-4" />
					</button>
				</div>

				<form
					onSubmit={onSubmit}
					className="space-y-4"
				>
					<div className="space-y-1.5">
						<Label htmlFor="pf-name">Name</Label>
						<Input
							id="pf-name"
							value={name}
							onChange={e => setName(e.target.value)}
							placeholder="e.g. MBA Intelligence Q2"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="pf-kw">Keyword / Topic</Label>
						<Input
							id="pf-kw"
							value={keyword}
							onChange={e => setKeyword(e.target.value)}
							placeholder="e.g. MBA programs India"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="pf-comp">
							Competitors (comma-separated)
						</Label>
						<Input
							id="pf-comp"
							value={competitors}
							onChange={e => setCompetitors(e.target.value)}
							placeholder="Amity, Symbiosis, Manipal"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="pf-domains">
							Competitor Domains (comma-separated)
						</Label>
						<Input
							id="pf-domains"
							value={competitorDomains}
							onChange={e => setCompetitorDomains(e.target.value)}
							placeholder="amity.edu, symbiosis.ac.in"
						/>
						<p className="text-[11px] text-zinc-400">
							These domains will be directly crawled on every
							scan.
						</p>
					</div>
					<div className="space-y-1.5">
						<Label>Frequency</Label>
						<Select
							value={frequency}
							onValueChange={setFrequency}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="daily">Daily</SelectItem>
								<SelectItem value="weekly">Weekly</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Select Models</Label>
						<div className="grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
							{MODEL_OPTIONS.map(model => (
								<label
									key={model.key}
									className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200"
								>
									<input
										type="checkbox"
										checked={selectedModels.includes(
											model.key
										)}
										disabled={model.locked}
										onChange={() => toggleModel(model.key)}
										className="size-4 rounded border-zinc-300"
									/>
									<span>{model.label}</span>
									{model.locked && (
										<span className="text-[10px] text-zinc-400">
											always on
										</span>
									)}
								</label>
							))}
						</div>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onClose}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							disabled={busy}
						>
							{busy ? "Creating…" : "Create"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}

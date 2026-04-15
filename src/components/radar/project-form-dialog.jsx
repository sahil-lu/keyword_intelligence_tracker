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
import { useState } from "react"
import { toast } from "sonner"

export function ProjectFormDialog({ onClose }) {
	const { createProject } = useRadarStore()
	const [name, setName] = useState("")
	const [keyword, setKeyword] = useState("")
	const [competitors, setCompetitors] = useState("")
	const [frequency, setFrequency] = useState("daily")
	const [busy, setBusy] = useState(false)

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
			await createProject({
				name: name.trim(),
				keyword: keyword.trim(),
				competitors: comp,
				frequency,
			})
			toast.success("Project created")
			onClose()
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
							placeholder="e.g. Student lending Q2"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="pf-kw">Keyword / Topic</Label>
						<Input
							id="pf-kw"
							value={keyword}
							onChange={e => setKeyword(e.target.value)}
							placeholder="e.g. student loan refinance"
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
							placeholder="SoFi, Earnest"
						/>
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

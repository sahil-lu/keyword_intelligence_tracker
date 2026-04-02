"use client"

import { Button } from "@/ui/button"
import { Card } from "@/ui/card"
import { Input } from "@/ui/input"
import { Label } from "@/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select"
import { IntelligenceReportDashboard } from "@/components/radar/intelligence-report-dashboard"
import { useFirebaseAuth } from "@/providers/firebase-auth-provider"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

const apiBase =
	process.env.NEXT_PUBLIC_RADAR_API_URL?.replace(/\/$/, "") ||
	"http://localhost:4000"

async function api(path, options = {}) {
	let res
	try {
		res = await fetch(`${apiBase}${path}`, {
			...options,
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
		})
	} catch (err) {
		throw new Error(
			`Cannot reach the API at ${apiBase}. Start it with \`pnpm radar:api:dev\` from the repo root (and check server/.env). ${err?.message || ""}`
		)
	}

	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		throw new Error(
			data.error ||
				res.statusText ||
				`Request failed (${res.status}). Check the API terminal for details.`
		)
	}
	return data
}

export function MonitoringDashboard() {
	const { user, signOut } = useFirebaseAuth()
	const [projects, setProjects] = useState([])
	const [loadingList, setLoadingList] = useState(true)
	const [selectedId, setSelectedId] = useState("")
	const [report, setReport] = useState(null)
	const [reportLoading, setReportLoading] = useState(false)

	const [name, setName] = useState("")
	const [keyword, setKeyword] = useState("")
	const [competitors, setCompetitors] = useState("")
	const [frequency, setFrequency] = useState("daily")
	const [creating, setCreating] = useState(false)
	const [running, setRunning] = useState(false)

	const refreshProjects = useCallback(async () => {
		setLoadingList(true)
		try {
			const list = await api("/projects")
			setProjects(list)
			setSelectedId(prev => prev || list[0]?.id || "")
		} catch (e) {
			console.error(e)
			toast.error(e.message || "Could not load projects.")
		} finally {
			setLoadingList(false)
		}
	}, [])

	useEffect(() => {
		refreshProjects()
	}, [refreshProjects])

	const loadReport = useCallback(async id => {
		if (!id) return
		setReportLoading(true)
		setReport(null)
		try {
			const data = await api(`/projects/${id}/report`)
			setReport(data)
		} catch (e) {
			if (
				e.message?.includes("404") ||
				e.message?.toLowerCase?.().includes("not found") ||
				e.message?.includes("No reports")
			) {
				setReport(null)
			} else {
				toast.error(e.message || "Could not load report.")
			}
		} finally {
			setReportLoading(false)
		}
	}, [])

	useEffect(() => {
		if (selectedId) loadReport(selectedId)
	}, [selectedId, loadReport])

	const createProject = async e => {
		e.preventDefault()
		if (!name.trim() || !keyword.trim()) {
			toast.error("Name and keyword are required.")
			return
		}

		const comp = competitors
			.split(",")
			.map(s => s.trim())
			.filter(Boolean)

		setCreating(true)
		try {
			const created = await api("/projects", {
				method: "POST",
				body: JSON.stringify({
					name: name.trim(),
					keyword: keyword.trim(),
					competitors: comp,
					frequency,
				}),
			})
			toast.success("Project created.")
			setName("")
			setKeyword("")
			setCompetitors("")
			setFrequency("daily")
			await refreshProjects()
			setSelectedId(created.id)
		} catch (err) {
			toast.error(err.message || "Create failed.")
		} finally {
			setCreating(false)
		}
	}

	const runScan = async () => {
		if (!selectedId) {
			toast.error("Select a project first.")
			return
		}
		setRunning(true)
		try {
			await api(`/projects/${selectedId}/run`, { method: "POST" })
			toast.success("Scan finished — loading report.")
			await loadReport(selectedId)
		} catch (e) {
			toast.error(e.message || "Run failed.")
		} finally {
			setRunning(false)
		}
	}

	const r = report?.report

	const selectedProject = useMemo(
		() => projects.find(p => p.id === selectedId),
		[projects, selectedId]
	)
	const projectLabel = selectedProject
		? `${selectedProject.name} — ${selectedProject.keyword}`
		: ""

	return (
		<div className="flex h-full min-h-0 flex-col gap-4 overflow-auto p-4 md:p-6">
			<header className="border-oklch(0.92 0 0) dark:border-oklch(1 0 0 / 12%) flex shrink-0 flex-wrap items-center justify-between gap-3 border-b pb-4">
				<div>
					<h1 className="text-xl font-semibold tracking-tight">
						Monitoring
					</h1>
					<p className="text-oklch(0.45 0 0) dark:text-oklch(0.72 0 0) text-sm">
						Projects, scans, and latest AI report — API at{" "}
						<code className="bg-oklch(0.96 0 0) dark:bg-oklch(0.22 0 0) rounded px-1 text-xs">
							{apiBase}
						</code>
					</p>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-oklch(0.45 0 0) dark:text-oklch(0.65 0 0) hidden max-w-[200px] truncate text-xs sm:inline">
						{user?.email}
					</span>
					<Button
						variant="outline"
						size="sm"
						type="button"
						onClick={() => signOut()}
					>
						Sign out
					</Button>
				</div>
			</header>

			<div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
				<Card className="flex flex-col gap-4 p-4">
					<h2 className="text-sm font-medium">New project</h2>
					<form
						onSubmit={createProject}
						className="flex flex-col gap-3"
					>
						<div className="space-y-1.5">
							<Label htmlFor="p-name">Name</Label>
							<Input
								id="p-name"
								value={name}
								onChange={e => setName(e.target.value)}
								placeholder="e.g. Student lending Q2 desk research"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="p-keyword">Keyword / topic</Label>
							<Input
								id="p-keyword"
								value={keyword}
								onChange={e => setKeyword(e.target.value)}
								placeholder="e.g. student loan refinance"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="p-comp">
								Competitors (comma-separated)
							</Label>
							<Input
								id="p-comp"
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
									<SelectValue placeholder="Frequency" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="daily">Daily</SelectItem>
									<SelectItem value="weekly">
										Weekly
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<Button
							type="submit"
							disabled={creating}
						>
							{creating ? "Creating…" : "Create project"}
						</Button>
					</form>
				</Card>

				<Card className="ring-oklch(0.92 0 0) dark:ring-oklch(1 0 0 / 10%) flex min-h-0 flex-col overflow-hidden rounded-xl shadow-sm ring-1">
					<div className="border-oklch(0.92 0 0) bg-oklch(0.995 0 0) dark:border-oklch(1 0 0 / 10%) dark:bg-oklch(0.16 0 0) flex shrink-0 flex-wrap items-end gap-2 border-b p-4">
						<div className="min-w-0 flex-1 space-y-1.5">
							<Label>Active project</Label>
							<Select
								value={selectedId || undefined}
								onValueChange={setSelectedId}
								disabled={loadingList || !projects.length}
							>
								<SelectTrigger className="w-full">
									<SelectValue
										placeholder={
											loadingList
												? "Loading…"
												: "Select project"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{projects.map(p => (
										<SelectItem
											key={p.id}
											value={p.id}
										>
											{p.name} — {p.keyword}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Button
							variant="outline"
							type="button"
							size="sm"
							onClick={() => refreshProjects()}
						>
							Refresh list
						</Button>
					</div>

					<div className="bg-oklch(0.99 0 0) dark:bg-oklch(0.14 0 0) min-h-0 flex-1 overflow-y-auto px-3 py-2 sm:px-5">
						<IntelligenceReportDashboard
							executiveSummary={r?.executive_summary}
							topFindings={r?.top_findings}
							recommendations={r?.recommendations}
							projectName={projectLabel}
							onRunScan={selectedId ? runScan : undefined}
							running={running}
							loading={reportLoading}
						/>
					</div>
				</Card>
			</div>
		</div>
	)
}

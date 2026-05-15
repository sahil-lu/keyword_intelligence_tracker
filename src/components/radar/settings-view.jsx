"use client"

import { useRadarStore } from "@/stores/radar-store"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Label } from "@/ui/label"
import { cn } from "@/lib/utils"
import {
	FileUp,
	Globe,
	Link,
	Loader2,
	Mail,
	Brain,
	Plus,
	Save,
	Shield,
	Tag,
	Trash2,
	Users,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

const MODEL_OPTIONS = [
	{ key: "DEFAULT", label: "Default", locked: true },
	{ key: "OPENAI_DEEP_RESEARCH", label: "OpenAI Deep Research" },
	{ key: "GEMINI_DEEP_RESEARCH_MAX", label: "Gemini Deep Research Max" },
	{ key: "PERPLEXITY", label: "Perplexity" },
]

function SectionHeader({ icon: Icon, label, description }) {
	return (
		<div className="mb-4">
			<div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
				<div className="flex size-7 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
					<Icon className="size-3.5 text-zinc-500" />
				</div>
				{label}
			</div>
			{description && (
				<p className="mt-1 ml-9 text-xs text-zinc-500">{description}</p>
			)}
		</div>
	)
}

function UrlListEditor({ urls, onChange, placeholder }) {
	const [input, setInput] = useState("")

	const addUrl = () => {
		const val = input.trim()
		if (!val) return
		try {
			new URL(val.startsWith("http") ? val : `https://${val}`)
		} catch {
			return
		}
		const normalized = val.startsWith("http") ? val : `https://${val}`
		if (!urls.includes(normalized)) {
			onChange([...urls, normalized])
		}
		setInput("")
	}

	const removeUrl = idx => {
		onChange(urls.filter((_, i) => i !== idx))
	}

	return (
		<div className="space-y-2">
			<div className="flex gap-2">
				<Input
					value={input}
					onChange={e => setInput(e.target.value)}
					placeholder={placeholder}
					onKeyDown={e =>
						e.key === "Enter" && (e.preventDefault(), addUrl())
					}
					className="flex-1"
				/>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={addUrl}
					className="gap-1"
				>
					<Plus className="size-3" />
					Add
				</Button>
			</div>
			{urls.length > 0 && (
				<ul className="space-y-1">
					{urls.map((url, i) => (
						<li
							key={url}
							className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
						>
							<Link className="size-3 shrink-0 text-zinc-400" />
							<span className="min-w-0 flex-1 truncate text-zinc-700 dark:text-zinc-300">
								{url}
							</span>
							<button
								type="button"
								onClick={() => removeUrl(i)}
								className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
							>
								<Trash2 className="size-3" />
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}

function KeywordEditor({ keywords, onChange }) {
	const [input, setInput] = useState("")

	const addKeyword = () => {
		const val = input.trim()
		if (val && !keywords.includes(val)) {
			onChange([...keywords, val])
		}
		setInput("")
	}

	return (
		<div className="space-y-2">
			<div className="flex gap-2">
				<Input
					value={input}
					onChange={e => setInput(e.target.value)}
					placeholder="e.g. online MBA"
					onKeyDown={e =>
						e.key === "Enter" && (e.preventDefault(), addKeyword())
					}
					className="flex-1"
				/>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={addKeyword}
					className="gap-1"
				>
					<Plus className="size-3" />
					Add
				</Button>
			</div>
			{keywords.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{keywords.map((keyword, i) => (
						<span
							key={keyword}
							className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
						>
							<Tag className="size-2.5 text-zinc-400" />
							{keyword}
							<button
								type="button"
								onClick={() =>
									onChange(keywords.filter((_, j) => j !== i))
								}
								className="text-zinc-400 hover:text-red-500"
							>
								<Trash2 className="size-2.5" />
							</button>
						</span>
					))}
				</div>
			)}
		</div>
	)
}

function ModelSelector({ selectedModels, onChange }) {
	const toggleModel = model => {
		if (model === "DEFAULT") return
		if (selectedModels.includes(model)) {
			onChange(selectedModels.filter(item => item !== model))
		} else {
			onChange([...selectedModels, model])
		}
	}

	return (
		<div className="grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
			{MODEL_OPTIONS.map(model => (
				<label
					key={model.key}
					className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200"
				>
					<input
						type="checkbox"
						checked={selectedModels.includes(model.key)}
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
	)
}

function formatFileSize(bytes) {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DocumentUploader({ uploads, uploadsLoading, onUpload, onDelete }) {
	const inputRef = useRef(null)
	const [uploading, setUploading] = useState(false)
	const [dragOver, setDragOver] = useState(false)

	const handleFiles = useCallback(
		async files => {
			if (!files?.length) return
			setUploading(true)
			try {
				for (const file of files) {
					await onUpload(file)
				}
			} finally {
				setUploading(false)
				if (inputRef.current) inputRef.current.value = ""
			}
		},
		[onUpload]
	)

	const onDrop = useCallback(
		e => {
			e.preventDefault()
			setDragOver(false)
			handleFiles(e.dataTransfer.files)
		},
		[handleFiles]
	)

	return (
		<div className="space-y-3">
			<div
				onDragOver={e => {
					e.preventDefault()
					setDragOver(true)
				}}
				onDragLeave={() => setDragOver(false)}
				onDrop={onDrop}
				className={cn(
					"flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
					dragOver
						? "border-zinc-400 bg-zinc-100 dark:border-zinc-500 dark:bg-zinc-800"
						: "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50"
				)}
			>
				{uploading ? (
					<Loader2 className="size-5 animate-spin text-zinc-400" />
				) : (
					<FileUp className="size-5 text-zinc-400" />
				)}
				<p className="text-xs text-zinc-500">
					{uploading
						? "Uploading…"
						: "Drag & drop PDFs here, or click to browse"}
				</p>
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={uploading}
					onClick={() => inputRef.current?.click()}
					className="gap-1.5"
				>
					<Plus className="size-3" />
					Choose File
				</Button>
				<input
					ref={inputRef}
					type="file"
					accept=".pdf,.txt,.md,.csv"
					multiple
					className="hidden"
					onChange={e => handleFiles(e.target.files)}
				/>
			</div>

			{uploadsLoading && (
				<div className="flex items-center gap-2 py-2 text-xs text-zinc-400">
					<Loader2 className="size-3 animate-spin" />
					Loading documents…
				</div>
			)}

			{uploads.length > 0 && (
				<ul className="space-y-1">
					{uploads.map(doc => (
						<li
							key={doc.id}
							className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
						>
							<FileUp className="size-3 shrink-0 text-zinc-400" />
							<span className="min-w-0 flex-1 truncate text-zinc-700 dark:text-zinc-300">
								{doc.filename}
							</span>
							<span className="shrink-0 text-[10px] text-zinc-400">
								{formatFileSize(doc.fileSize)}
							</span>
							<button
								type="button"
								onClick={() => onDelete(doc.id)}
								className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
							>
								<Trash2 className="size-3" />
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}

function CompetitorEditor({
	competitors,
	domains,
	onCompChange,
	onDomainChange,
}) {
	const [nameInput, setNameInput] = useState("")
	const [domainInput, setDomainInput] = useState("")

	const addCompetitor = () => {
		const val = nameInput.trim()
		if (val && !competitors.includes(val)) {
			onCompChange([...competitors, val])
		}
		setNameInput("")
	}

	const addDomain = () => {
		const val = domainInput
			.trim()
			.replace(/^https?:\/\//, "")
			.replace(/\/.*$/, "")
		if (val && !domains.includes(val)) {
			onDomainChange([...domains, val])
		}
		setDomainInput("")
	}

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label className="text-xs text-zinc-500">
					Competitor Names
				</Label>
				<div className="flex gap-2">
					<Input
						value={nameInput}
						onChange={e => setNameInput(e.target.value)}
						placeholder="e.g. Amity, Symbiosis"
						onKeyDown={e =>
							e.key === "Enter" &&
							(e.preventDefault(), addCompetitor())
						}
						className="flex-1"
					/>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={addCompetitor}
						className="gap-1"
					>
						<Plus className="size-3" />
						Add
					</Button>
				</div>
				{competitors.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{competitors.map((c, i) => (
							<span
								key={c}
								className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
							>
								{c}
								<button
									type="button"
									onClick={() =>
										onCompChange(
											competitors.filter(
												(_, j) => j !== i
											)
										)
									}
									className="text-zinc-400 hover:text-red-500"
								>
									<Trash2 className="size-2.5" />
								</button>
							</span>
						))}
					</div>
				)}
			</div>

			<div className="space-y-2">
				<Label className="text-xs text-zinc-500">
					Competitor Domains (crawled every run)
				</Label>
				<div className="flex gap-2">
					<Input
						value={domainInput}
						onChange={e => setDomainInput(e.target.value)}
						placeholder="e.g. amity.edu, symbiosis.ac.in"
						onKeyDown={e =>
							e.key === "Enter" &&
							(e.preventDefault(), addDomain())
						}
						className="flex-1"
					/>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={addDomain}
						className="gap-1"
					>
						<Plus className="size-3" />
						Add
					</Button>
				</div>
				{domains.length > 0 && (
					<ul className="space-y-1">
						{domains.map((d, i) => (
							<li
								key={d}
								className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
							>
								<Globe className="size-3 shrink-0 text-zinc-400" />
								<span className="flex-1 truncate text-zinc-700 dark:text-zinc-300">
									{d}
								</span>
								<button
									type="button"
									onClick={() =>
										onDomainChange(
											domains.filter((_, j) => j !== i)
										)
									}
									className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
								>
									<Trash2 className="size-3" />
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	)
}

export function SettingsView() {
	const {
		projects,
		selectedProjectId,
		updateSources,
		updateKeywords,
		updateSelectedModels,
		updateCompetitors,
		updateEmailSettings,
		uploads,
		uploadsLoading,
		fetchUploads,
		uploadDocument,
		deleteUpload,
	} = useRadarStore()
	const project = projects.find(p => p.id === selectedProjectId)

	const [sources, setSources] = useState([])
	const [keywords, setKeywords] = useState([])
	const [selectedModels, setSelectedModels] = useState(["DEFAULT"])
	const [competitors, setCompetitors] = useState([])
	const [competitorDomains, setCompetitorDomains] = useState([])
	const [emailEnabled, setEmailEnabled] = useState(false)
	const [emailRecipients, setEmailRecipients] = useState([])
	const [emailInput, setEmailInput] = useState("")
	const [saving, setSaving] = useState("")

	useEffect(() => {
		if (project) {
			setSources(project.customSources || [])
			setKeywords(
				project.keywords?.length
					? project.keywords
					: project.keyword
						? [project.keyword]
						: []
			)
			setSelectedModels(
				project.selectedModels?.length
					? project.selectedModels
					: ["DEFAULT"]
			)
			setCompetitors(project.competitors || [])
			setCompetitorDomains(project.competitorDomains || [])
			setEmailEnabled(project.emailEnabled || false)
			setEmailRecipients(project.emailRecipients || [])
			fetchUploads()
		}
	}, [project, fetchUploads])

	if (!project) {
		return (
			<div className="flex items-center justify-center py-20 text-sm text-zinc-500">
				Select a project to view settings.
			</div>
		)
	}

	const saveSources = async () => {
		setSaving("sources")
		try {
			await updateSources(sources)
		} finally {
			setSaving("")
		}
	}

	const saveKeywords = async () => {
		setSaving("keywords")
		try {
			await updateKeywords(keywords)
		} finally {
			setSaving("")
		}
	}

	const saveModels = async () => {
		setSaving("models")
		try {
			await updateSelectedModels(selectedModels)
		} finally {
			setSaving("")
		}
	}

	const saveCompetitors = async () => {
		setSaving("competitors")
		try {
			await updateCompetitors({ competitors, competitorDomains })
		} finally {
			setSaving("")
		}
	}

	const addEmail = () => {
		const val = emailInput.trim().toLowerCase()
		if (val && val.includes("@") && !emailRecipients.includes(val)) {
			setEmailRecipients([...emailRecipients, val])
		}
		setEmailInput("")
	}

	const saveEmail = async () => {
		setSaving("email")
		try {
			await updateEmailSettings({ emailEnabled, emailRecipients })
		} finally {
			setSaving("")
		}
	}

	return (
		<div className="mx-auto max-w-2xl space-y-8 p-6 pb-12">
			<h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
				Project Settings
			</h2>

			{/* Keywords */}
			<section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<SectionHeader
					icon={Tag}
					label="Keywords"
					description="Topics used to generate search queries for this project."
				/>
				<KeywordEditor
					keywords={keywords}
					onChange={setKeywords}
				/>
				<div className="mt-4 flex justify-end">
					<Button
						size="sm"
						onClick={saveKeywords}
						disabled={
							saving === "keywords" || keywords.length === 0
						}
						className="gap-1.5"
					>
						<Save className="size-3" />
						{saving === "keywords" ? "Saving…" : "Save Keywords"}
					</Button>
				</div>
			</section>

			{/* Models */}
			<section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<SectionHeader
					icon={Brain}
					label="Intelligence Models"
					description="Choose which models generate individual reports for this project. Default always runs."
				/>
				<ModelSelector
					selectedModels={selectedModels}
					onChange={setSelectedModels}
				/>
				<div className="mt-4 flex justify-end">
					<Button
						size="sm"
						onClick={saveModels}
						disabled={saving === "models"}
						className="gap-1.5"
					>
						<Save className="size-3" />
						{saving === "models" ? "Saving…" : "Save Models"}
					</Button>
				</div>
			</section>

			{/* Custom Sources */}
			<section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<SectionHeader
					icon={Link}
					label="Custom Sources"
					description="URLs that will be crawled on every scan, regardless of search results."
				/>
				<UrlListEditor
					urls={sources}
					onChange={setSources}
					placeholder="https://example.com/page"
				/>
				<div className="mt-4 flex justify-end">
					<Button
						size="sm"
						onClick={saveSources}
						disabled={saving === "sources"}
						className="gap-1.5"
					>
						<Save className="size-3" />
						{saving === "sources" ? "Saving…" : "Save Sources"}
					</Button>
				</div>
			</section>

			{/* Uploaded Documents */}
			<section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<SectionHeader
					icon={FileUp}
					label="Uploaded Documents"
					description="Upload PDF or text files. Their content will be analyzed as a source during every scan."
				/>
				<DocumentUploader
					uploads={uploads}
					uploadsLoading={uploadsLoading}
					onUpload={uploadDocument}
					onDelete={deleteUpload}
				/>
			</section>

			{/* Competitors */}
			<section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<SectionHeader
					icon={Users}
					label="Competitors"
					description="Competitor names are used for search queries. Domains are directly crawled every run."
				/>
				<CompetitorEditor
					competitors={competitors}
					domains={competitorDomains}
					onCompChange={setCompetitors}
					onDomainChange={setCompetitorDomains}
				/>
				<div className="mt-4 flex justify-end">
					<Button
						size="sm"
						onClick={saveCompetitors}
						disabled={saving === "competitors"}
						className="gap-1.5"
					>
						<Save className="size-3" />
						{saving === "competitors"
							? "Saving…"
							: "Save Competitors"}
					</Button>
				</div>
			</section>

			{/* Email Settings */}
			<section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
				<SectionHeader
					icon={Mail}
					label="Email Reports"
					description="Receive daily/weekly intelligence reports via email after each scheduled scan."
				/>
				<div className="space-y-4">
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => setEmailEnabled(!emailEnabled)}
							className={cn(
								"relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
								emailEnabled
									? "bg-emerald-500"
									: "bg-zinc-300 dark:bg-zinc-700"
							)}
						>
							<span
								className={cn(
									"inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform",
									emailEnabled
										? "translate-x-[18px]"
										: "translate-x-[3px]"
								)}
							/>
						</button>
						<Label className="text-sm">
							Enable daily email reports
						</Label>
					</div>

					<div className="space-y-2">
						<Label className="text-xs text-zinc-500">
							Recipients
						</Label>
						<div className="flex gap-2">
							<Input
								value={emailInput}
								onChange={e => setEmailInput(e.target.value)}
								placeholder="user@example.com"
								type="email"
								onKeyDown={e =>
									e.key === "Enter" &&
									(e.preventDefault(), addEmail())
								}
								className="flex-1"
							/>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={addEmail}
								className="gap-1"
							>
								<Plus className="size-3" />
								Add
							</Button>
						</div>
						{emailRecipients.length > 0 && (
							<div className="flex flex-wrap gap-1.5">
								{emailRecipients.map((email, i) => (
									<span
										key={email}
										className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
									>
										<Mail className="size-2.5 text-zinc-400" />
										{email}
										<button
											type="button"
											onClick={() =>
												setEmailRecipients(
													emailRecipients.filter(
														(_, j) => j !== i
													)
												)
											}
											className="text-zinc-400 hover:text-red-500"
										>
											<Trash2 className="size-2.5" />
										</button>
									</span>
								))}
							</div>
						)}
					</div>

					<div className="flex justify-end">
						<Button
							size="sm"
							onClick={saveEmail}
							disabled={saving === "email"}
							className="gap-1.5"
						>
							<Save className="size-3" />
							{saving === "email"
								? "Saving…"
								: "Save Email Settings"}
						</Button>
					</div>
				</div>
			</section>

			{/* Env Info */}
			<section className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
				<div className="flex items-start gap-2">
					<Shield className="mt-0.5 size-4 text-zinc-400" />
					<div className="text-xs text-zinc-500">
						<p className="font-medium text-zinc-700 dark:text-zinc-300">
							Backend API keys required
						</p>
						<p className="mt-1">
							For email to work, set{" "}
							<code className="rounded bg-zinc-200 px-1 py-0.5 dark:bg-zinc-800">
								EMAIL_API_KEY
							</code>{" "}
							and{" "}
							<code className="rounded bg-zinc-200 px-1 py-0.5 dark:bg-zinc-800">
								EMAIL_FROM
							</code>{" "}
							in your server{" "}
							<code className="rounded bg-zinc-200 px-1 py-0.5 dark:bg-zinc-800">
								.env
							</code>
							. For Exa/Firecrawl, add{" "}
							<code className="rounded bg-zinc-200 px-1 py-0.5 dark:bg-zinc-800">
								EXA_API_KEY
							</code>{" "}
							and{" "}
							<code className="rounded bg-zinc-200 px-1 py-0.5 dark:bg-zinc-800">
								FIRECRAWL_API_KEY
							</code>
							.
						</p>
					</div>
				</div>
			</section>
		</div>
	)
}

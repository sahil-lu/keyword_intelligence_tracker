"use client"

import { useRadarStore } from "@/stores/radar-store"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/ui/dialog"
import { Skeleton } from "@/ui/skeleton"
import { ExternalLink, FolderOpen, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

function formatDate(ts) {
	if (!ts) return "—"
	const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts)
	if (Number.isNaN(d.getTime())) return "—"
	return d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	})
}

function hostOf(url) {
	try {
		return new URL(url).hostname.replace(/^www\./, "")
	} catch {
		return url || ""
	}
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

function sourceProviderLabel(doc) {
	if (doc.source_provider && doc.source_provider !== "unknown") {
		return doc.source_provider
	}
	if (doc.source_type === "custom") return "custom"
	if (doc.source_type === "competitor") return "competitor"
	if (doc.source_type === "search") return "search"
	return doc.source_type || "unknown"
}

function DocumentsSkeleton() {
	return (
		<div className="space-y-2">
			{[1, 2, 3, 4].map(i => (
				<Skeleton
					key={i}
					className="h-14 w-full rounded-lg"
				/>
			))}
		</div>
	)
}

export function DocumentsView() {
	const { documents, documentsLoading, selectedProjectId, fetchDocuments } =
		useRadarStore()
	const [selectedDocument, setSelectedDocument] = useState(null)
	const [searchQuery, setSearchQuery] = useState("")

	useEffect(() => {
		if (selectedProjectId) fetchDocuments()
	}, [selectedProjectId, fetchDocuments])

	const filteredDocuments = useMemo(() => {
		const query = searchQuery.trim().toLowerCase()
		if (!query) return documents
		return documents.filter(doc => {
			const haystack = [
				doc.url,
				hostOf(doc.url),
				doc.title,
				sourceProviderLabel(doc),
				doc.article_brief,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase()
			return haystack.includes(query)
		})
	}, [documents, searchQuery])

	return (
		<div className="w-full space-y-6 px-0 pb-12">
			<div className="mx-7 flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<div className="flex size-7 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
						<FolderOpen className="size-3.5 text-zinc-500" />
					</div>
					<h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
						Tracked Sources
					</h2>
				</div>
				<div className="relative w-full max-w-xs">
					<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
					<input
						type="search"
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						placeholder="Search sources..."
						className="h-9 w-full rounded-xl border border-zinc-200 bg-white pr-3 pl-9 text-sm text-zinc-800 transition-colors outline-none placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-700"
					/>
				</div>
			</div>

			{documentsLoading ? (
				<DocumentsSkeleton />
			) : documents.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
						<FolderOpen className="size-5 text-zinc-400" />
					</div>
					<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
						No sources
					</p>
					<p className="mt-1 text-xs text-zinc-500">
						Sources are tracked automatically after each scan.
					</p>
				</div>
			) : filteredDocuments.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
						<Search className="size-5 text-zinc-400" />
					</div>
					<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
						No sources found
					</p>
					<p className="mt-1 text-xs text-zinc-500">
						Try a different URL, title, provider, or article
						keyword.
					</p>
				</div>
			) : (
				<div className="w-full overflow-x-auto border-y border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
								<th className="px-4 py-2.5">URL</th>
								<th className="px-4 py-2.5">Title</th>
								<th className="px-4 py-2.5">Found By</th>
								<th className="px-4 py-2.5">First Seen</th>
								<th className="px-4 py-2.5">Last Seen</th>
								<th className="px-4 py-2.5">Runs</th>
							</tr>
						</thead>
						<tbody>
							{filteredDocuments.map((doc, i) => (
								<tr
									key={doc.id || i}
									onClick={() => setSelectedDocument(doc)}
									className="cursor-pointer border-b border-zinc-50 transition-colors last:border-0 hover:bg-zinc-50/50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/30"
								>
									<td className="max-w-xs px-4 py-3">
										<a
											href={doc.url}
											target="_blank"
											rel="noopener noreferrer"
											onClick={e => e.stopPropagation()}
											className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
										>
											<Favicon url={doc.url} />
											<span className="truncate">
												{hostOf(doc.url)}
											</span>
											<ExternalLink className="size-3 shrink-0" />
										</a>
									</td>
									<td className="max-w-xs px-4 py-3">
										<span className="line-clamp-1 text-zinc-900 dark:text-zinc-50">
											{doc.title}
										</span>
									</td>
									<td className="px-4 py-3">
										<span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-600 uppercase dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
											{sourceProviderLabel(doc)}
										</span>
									</td>
									<td className="px-4 py-3 text-xs text-zinc-500">
										{formatDate(doc.firstSeenAt)}
									</td>
									<td className="px-4 py-3 text-xs text-zinc-500">
										{formatDate(doc.lastSeenAt)}
									</td>
									<td className="px-4 py-3 text-xs text-zinc-500">
										{doc.seenInRuns?.length || 0}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			<DocumentDialog
				document={selectedDocument}
				open={Boolean(selectedDocument)}
				onOpenChange={open => {
					if (!open) setSelectedDocument(null)
				}}
			/>
		</div>
	)
}

function DocumentDialog({ document, open, onOpenChange }) {
	if (!document) return null
	const brief =
		document.article_brief ||
		(document.title
			? `This source appears to cover: ${document.title}`
			: "A brief is not available for this source yet. Run a new scan to capture article summaries for tracked sources.")

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<DialogContent className="border-0 bg-white p-0 shadow-2xl ring-0 sm:max-w-lg dark:bg-zinc-950">
				<DialogHeader>
					<div className="border-b border-zinc-100 px-6 pt-6 pb-4 dark:border-zinc-800">
						<DialogTitle className="pr-10 text-xl leading-tight font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
							{document.title || hostOf(document.url)}
						</DialogTitle>
						<DialogDescription asChild>
							<div className="mt-3 flex flex-wrap items-center gap-2">
								{document.url && (
									<a
										href={document.url}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
									>
										<Favicon url={document.url} />
										<span className="max-w-64 truncate">
											{hostOf(document.url)}
										</span>
										<ExternalLink className="size-3 shrink-0" />
									</a>
								)}
								<span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-zinc-600 uppercase dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
									{sourceProviderLabel(document)}
								</span>
							</div>
						</DialogDescription>
					</div>
				</DialogHeader>

				<div className="space-y-4 p-6">
					<div className="rounded-3xl bg-zinc-50 p-4 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800">
						<p className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
							Article Brief
						</p>
						<p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
							{brief}
						</p>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

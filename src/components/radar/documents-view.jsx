"use client"

import { useRadarStore } from "@/stores/radar-store"
import { Skeleton } from "@/ui/skeleton"
import { ExternalLink, FolderOpen } from "lucide-react"
import { useEffect } from "react"

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

	useEffect(() => {
		if (selectedProjectId) fetchDocuments()
	}, [selectedProjectId, fetchDocuments])

	return (
		<div className="mx-auto max-w-5xl space-y-6 p-6">
			<div className="flex items-center gap-2">
				<div className="flex size-7 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
					<FolderOpen className="size-3.5 text-zinc-500" />
				</div>
				<h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
					Tracked Documents
				</h2>
			</div>

			{documentsLoading ? (
				<DocumentsSkeleton />
			) : documents.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
						<FolderOpen className="size-5 text-zinc-400" />
					</div>
					<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
						No documents
					</p>
					<p className="mt-1 text-xs text-zinc-500">
						Documents are tracked automatically after each scan.
					</p>
				</div>
			) : (
				<div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
								<th className="px-4 py-2.5">URL</th>
								<th className="px-4 py-2.5">Title</th>
								<th className="px-4 py-2.5">First Seen</th>
								<th className="px-4 py-2.5">Last Seen</th>
								<th className="px-4 py-2.5">Runs</th>
							</tr>
						</thead>
						<tbody>
							{documents.map((doc, i) => (
								<tr
									key={doc.id || i}
									className="border-b border-zinc-50 transition-colors last:border-0 hover:bg-zinc-50/50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/30"
								>
									<td className="max-w-xs px-4 py-3">
										<a
											href={doc.url}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
										>
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
		</div>
	)
}

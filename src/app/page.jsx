"use client"

import { useFirebaseAuth } from "@/providers/firebase-auth-provider"
import { useRadarStore } from "@/stores/radar-store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
	const { user, loading, configError } = useFirebaseAuth()
	const router = useRouter()
	const { projects, projectsLoading, fetchProjects } = useRadarStore()

	useEffect(() => {
		if (!loading && user) fetchProjects()
	}, [loading, user, fetchProjects])

	useEffect(() => {
		if (loading) return
		if (configError || !user) {
			router.replace("/login")
			return
		}
		if (!projectsLoading && projects.length > 0) {
			router.replace(`/project/${projects[0].id}/report`)
		}
	}, [loading, configError, user, projectsLoading, projects, router])

	return (
		<div className="flex flex-1 items-center justify-center">
			<p className="text-sm text-zinc-500">Loading…</p>
		</div>
	)
}

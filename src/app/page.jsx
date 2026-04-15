"use client"

import { DashboardLayout } from "@/components/radar/dashboard-layout"
import { useFirebaseAuth } from "@/providers/firebase-auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
	const { user, loading, configError } = useFirebaseAuth()
	const router = useRouter()

	useEffect(() => {
		if (loading) return
		if (configError || !user) {
			router.replace("/login")
		}
	}, [loading, configError, user, router])

	if (loading) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<p className="text-sm text-zinc-500">Loading…</p>
			</div>
		)
	}

	if (!user) return null

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<DashboardLayout />
		</div>
	)
}

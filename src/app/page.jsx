"use client"

import { MonitoringDashboard } from "@/components/radar/monitoring-dashboard"
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
				<p className="text-oklch(0.45 0 0) dark:text-oklch(0.75 0 0) text-sm">
					Loading…
				</p>
			</div>
		)
	}

	if (!user) {
		return null
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<MonitoringDashboard />
		</div>
	)
}

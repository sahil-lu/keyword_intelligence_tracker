import { cn } from "@/lib/utils"
import Analytics from "@/providers/analytics"
import { FirebaseAuthProvider } from "@/providers/firebase-auth-provider"
import QueryParamsProvider from "@/providers/queryParams"
import { TooltipProvider } from "@/ui/tooltip"
import { Geist } from "next/font/google"
import { Suspense } from "react"
import { Toaster } from "sonner"
import "./globals.css"

const geist = Geist({
	subsets: ["latin"],
})

export const viewport = {
	viewportFit: "cover",
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
}

export const metadata = {
	title: "Keyword Intelligence Radar",
	description: "Keyword monitoring, scans, and AI reports",
}

export default function RootLayout({ children }) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
		>
			<body
				className={cn(
					"h-dvh w-screen overflow-hidden bg-white text-gray-950 antialiased dark:bg-gray-950 dark:text-gray-50",
					geist.className
				)}
				suppressHydrationWarning
			>
				<Suspense>
					<QueryParamsProvider />
				</Suspense>
				<TooltipProvider>
					<FirebaseAuthProvider>
						<div className="flex h-dvh flex-col overflow-hidden">
							{children}
						</div>
					</FirebaseAuthProvider>
					<Toaster richColors />
				</TooltipProvider>
				<Analytics />
			</body>
		</html>
	)
}

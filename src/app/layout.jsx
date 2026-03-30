import { cn } from "@/lib/utils"
import Analytics from "@/providers/analytics"
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
	title: "Keyword_intelligence_radar",
	description: "Keyword_intelligence_radar",
}

export default function RootLayout({ children }) {
	return (
			<html
				lang="en"
				suppressHydrationWarning
			>
				<body
					className={cn(
						"h-dvh w-screen overflow-hidden bg-white dark:bg-gray-950 text-gray-950 dark:text-gray-50 antialiased",
						geist.className
					)}
					suppressHydrationWarning
				>
					<Suspense>
						<QueryParamsProvider />
					</Suspense>
					<TooltipProvider>
						<div className="flex h-full flex-col overflow-hidden">
							{children}
						</div>
						<Toaster richColors />
					</TooltipProvider>
					<Analytics />
				</body>
			</html>
	)
}
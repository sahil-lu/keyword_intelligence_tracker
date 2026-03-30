"use client"

import { Button } from "@/ui/button"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

const ThemeSwitcher = () => {
	const { theme, setTheme } = useTheme()

	return (
		<Button
			size="icon"
			variant="outline"
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
		>
			{theme === "dark" ? (
				<MoonIcon className="h-4 w-4" />
			) : (
				<SunIcon className="h-4 w-4" />
			)}
		</Button>
	)
}

export default ThemeSwitcher

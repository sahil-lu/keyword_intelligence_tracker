import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"
import * as React from "react"
import { useState } from "react"

function Input({ className, type, value = "", enableShowPassword, ...props }) {
	const [showPassword, setShowPassword] = useState(false)

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword)
	}

	const inputType =
		enableShowPassword && type === "password"
			? showPassword
				? "text"
				: "password"
			: type

	return (
		<div className="relative w-full">
			<input
				type={inputType}
				data-slot="input"
				className={cn(
					"border-oklch(0.922 0 0) file:text-oklch(0.145 0 0) placeholder:text-oklch(0.556 0 0) focus-visible:border-oklch(0.708 0 0) focus-visible:ring-oklch(0.708 0 0)/50 disabled:bg-oklch(0.922 0 0)/50 aria-invalid:border-oklch(0.577 0.245 27.325) aria-invalid:ring-oklch(0.577 0.245 27.325)/20 dark:bg-oklch(0.922 0 0)/30 dark:disabled:bg-oklch(0.922 0 0)/80 dark:aria-invalid:border-oklch(0.577 0.245 27.325)/50 dark:aria-invalid:ring-oklch(0.577 0.245 27.325)/40 dark:border-oklch(1 0 0 / 10%) dark:border-oklch(1 0 0 / 15%) dark:file:text-oklch(0.985 0 0) dark:placeholder:text-oklch(0.708 0 0) dark:focus-visible:border-oklch(0.556 0 0) dark:focus-visible:ring-oklch(0.556 0 0)/50 dark:disabled:bg-oklch(1 0 0 / 15%)/50 dark:aria-invalid:border-oklch(0.704 0.191 22.216) dark:aria-invalid:ring-oklch(0.704 0.191 22.216)/20 dark:dark:bg-oklch(1 0 0 / 15%)/30 dark:dark:disabled:bg-oklch(1 0 0 / 15%)/80 dark:dark:aria-invalid:border-oklch(0.704 0.191 22.216)/50 dark:dark:aria-invalid:ring-oklch(0.704 0.191 22.216)/40 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm",
					className,
					enableShowPassword && type === "password" ? "pr-10" : ""
				)}
				value={value ?? ""}
				{...props}
			/>
			{enableShowPassword && type === "password" && (
				<button
					type="button"
					onClick={togglePasswordVisibility}
					className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 focus:outline-none dark:text-neutral-400 dark:hover:text-neutral-300"
					tabIndex={-1}
					aria-label={
						showPassword ? "Hide password" : "Show password"
					}
				>
					{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
				</button>
			)}
		</div>
	)
}

export { Input }

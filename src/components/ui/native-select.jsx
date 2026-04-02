import * as React from "react"

import { cn } from "@/lib/utils"
import { ChevronDownIcon } from "lucide-react"

function NativeSelect({ className, size = "default", ...props }) {
	return (
		<div
			className={cn(
				"group/native-select relative w-fit has-[select:disabled]:opacity-50",
				className
			)}
			data-slot="native-select-wrapper"
			data-size={size}
		>
			<select
				data-slot="native-select"
				data-size={size}
				className="border-oklch(0.922 0 0) selection:bg-oklch(0.205 0 0) selection:text-oklch(0.985 0 0) placeholder:text-oklch(0.556 0 0) focus-visible:border-oklch(0.708 0 0) focus-visible:ring-oklch(0.708 0 0)/50 aria-invalid:border-oklch(0.577 0.245 27.325) aria-invalid:ring-oklch(0.577 0.245 27.325)/20 dark:bg-oklch(0.922 0 0)/30 dark:hover:bg-oklch(0.922 0 0)/50 dark:aria-invalid:border-oklch(0.577 0.245 27.325)/50 dark:aria-invalid:ring-oklch(0.577 0.245 27.325)/40 dark:border-oklch(1 0 0 / 10%) dark:border-oklch(1 0 0 / 15%) dark:selection:bg-oklch(0.922 0 0) dark:selection:text-oklch(0.205 0 0) dark:placeholder:text-oklch(0.708 0 0) dark:focus-visible:border-oklch(0.556 0 0) dark:focus-visible:ring-oklch(0.556 0 0)/50 dark:aria-invalid:border-oklch(0.704 0.191 22.216) dark:aria-invalid:ring-oklch(0.704 0.191 22.216)/20 dark:dark:bg-oklch(1 0 0 / 15%)/30 dark:dark:hover:bg-oklch(1 0 0 / 15%)/50 dark:dark:aria-invalid:border-oklch(0.704 0.191 22.216)/50 dark:dark:aria-invalid:ring-oklch(0.704 0.191 22.216)/40 h-8 w-full min-w-0 appearance-none rounded-lg border bg-transparent py-1 pr-8 pl-2.5 text-sm transition-colors outline-none select-none focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:ring-3 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] data-[size=sm]:py-0.5"
				{...props}
			/>
			<ChevronDownIcon
				className="text-oklch(0.556 0 0) dark:text-oklch(0.708 0 0) pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 select-none"
				aria-hidden="true"
				data-slot="native-select-icon"
			/>
		</div>
	)
}

function NativeSelectOption({ ...props }) {
	return (
		<option
			data-slot="native-select-option"
			{...props}
		/>
	)
}

function NativeSelectOptGroup({ className, ...props }) {
	return (
		<optgroup
			data-slot="native-select-optgroup"
			className={cn(className)}
			{...props}
		/>
	)
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }

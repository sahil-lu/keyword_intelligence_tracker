"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Progress({ className, value, ...props }) {
	return (
		<ProgressPrimitive.Root
			data-slot="progress"
			className={cn(
				"bg-oklch(0.97 0 0) dark:bg-oklch(0.269 0 0) relative flex h-1 w-full items-center overflow-x-hidden rounded-full",
				className
			)}
			{...props}
		>
			<ProgressPrimitive.Indicator
				data-slot="progress-indicator"
				className="bg-oklch(0.205 0 0) dark:bg-oklch(0.922 0 0) size-full flex-1 transition-all"
				style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
			/>
		</ProgressPrimitive.Root>
	)
}

export { Progress }

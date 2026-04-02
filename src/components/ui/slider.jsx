"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Slider({
	className,
	defaultValue,
	value,
	min = 0,
	max = 100,
	...props
}) {
	const _values = React.useMemo(
		() =>
			Array.isArray(value)
				? value
				: Array.isArray(defaultValue)
					? defaultValue
					: [min, max],
		[value, defaultValue, min, max]
	)

	return (
		<SliderPrimitive.Root
			data-slot="slider"
			defaultValue={defaultValue}
			value={value}
			min={min}
			max={max}
			className={cn(
				"relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
				className
			)}
			{...props}
		>
			<SliderPrimitive.Track
				data-slot="slider-track"
				className="bg-oklch(0.97 0 0) dark:bg-oklch(0.269 0 0) relative grow overflow-hidden rounded-full data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
			>
				<SliderPrimitive.Range
					data-slot="slider-range"
					className="bg-oklch(0.205 0 0) dark:bg-oklch(0.922 0 0) absolute select-none data-horizontal:h-full data-vertical:w-full"
				/>
			</SliderPrimitive.Track>
			{Array.from({ length: _values.length }, (_, index) => (
				<SliderPrimitive.Thumb
					data-slot="slider-thumb"
					key={index}
					className="border-oklch(0.922 0 0) border-oklch(0.708 0 0) ring-oklch(0.708 0 0)/50 dark:border-oklch(1 0 0 / 10%) dark:border-oklch(0.556 0 0) dark:ring-oklch(0.556 0 0)/50 relative block size-3 shrink-0 rounded-full border bg-white transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
				/>
			))}
		</SliderPrimitive.Root>
	)
}

export { Slider }

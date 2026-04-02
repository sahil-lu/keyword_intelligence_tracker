"use client"

import * as React from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

function Accordion({ className, ...props }) {
	return (
		<AccordionPrimitive.Root
			data-slot="accordion"
			className={cn("flex w-full flex-col", className)}
			{...props}
		/>
	)
}

function AccordionItem({ className, ...props }) {
	return (
		<AccordionPrimitive.Item
			data-slot="accordion-item"
			className={cn("not-last:border-b", className)}
			{...props}
		/>
	)
}

function AccordionTrigger({ className, children, ...props }) {
	return (
		<AccordionPrimitive.Header className="flex">
			<AccordionPrimitive.Trigger
				data-slot="accordion-trigger"
				className={cn(
					"group/accordion-trigger border-oklch(0.922 0 0) focus-visible:border-oklch(0.708 0 0) focus-visible:ring-oklch(0.708 0 0)/50 focus-visible:after:border-oklch(0.708 0 0) **:data-[slot=accordion-trigger-icon]:text-oklch(0.556 0 0) dark:border-oklch(1 0 0 / 10%) dark:focus-visible:border-oklch(0.556 0 0) dark:focus-visible:ring-oklch(0.556 0 0)/50 dark:focus-visible:after:border-oklch(0.556 0 0) dark:**:data-[slot=accordion-trigger-icon]:text-oklch(0.708 0 0) relative flex flex-1 items-start justify-between rounded-lg border border-transparent py-2.5 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4",
					className
				)}
				{...props}
			>
				{children}
				<ChevronDownIcon
					data-slot="accordion-trigger-icon"
					className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
				/>
				<ChevronUpIcon
					data-slot="accordion-trigger-icon"
					className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
				/>
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	)
}

function AccordionContent({ className, children, ...props }) {
	return (
		<AccordionPrimitive.Content
			data-slot="accordion-content"
			className="data-open:animate-accordion-down data-closed:animate-accordion-up overflow-hidden text-sm"
			{...props}
		>
			<div
				className={cn(
					"[&_a]:hover:text-oklch(0.145 0 0) dark:[&_a]:hover:text-oklch(0.985 0 0) h-(--radix-accordion-content-height) pt-0 pb-2.5 [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4",
					className
				)}
			>
				{children}
			</div>
		</AccordionPrimitive.Content>
	)
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group"
import { SearchIcon, CheckIcon } from "lucide-react"

function Command({ className, ...props }) {
	return (
		<CommandPrimitive
			data-slot="command"
			className={cn(
				"bg-oklch(1 0 0) text-oklch(0.145 0 0) dark:bg-oklch(0.205 0 0) dark:text-oklch(0.985 0 0) flex size-full flex-col overflow-hidden rounded-xl! p-1",
				className
			)}
			{...props}
		/>
	)
}

function CommandDialog({
	title = "Command Palette",
	description = "Search for a command to run...",
	children,
	className,
	dismissible = false,
	...props
}) {
	return (
		<Dialog {...props}>
			<DialogHeader className="sr-only">
				<DialogTitle>{title}</DialogTitle>
				<DialogDescription>{description}</DialogDescription>
			</DialogHeader>
			<DialogContent
				className={cn(
					"top-1/3 translate-y-0 overflow-hidden rounded-xl! p-0",
					className
				)}
				dismissible={dismissible}
			>
				{children}
			</DialogContent>
		</Dialog>
	)
}

function CommandInput({ className, ...props }) {
	return (
		<div
			data-slot="command-input-wrapper"
			className="p-1 pb-0"
		>
			<InputGroup className="border-oklch(0.922 0 0)/30 bg-oklch(0.922 0 0)/30 dark:border-oklch(1 0 0 / 15%)/30 dark:bg-oklch(1 0 0 / 15%)/30 h-8! rounded-lg! shadow-none! *:data-[slot=input-group-addon]:pl-2!">
				<CommandPrimitive.Input
					data-slot="command-input"
					className={cn(
						"w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
						className
					)}
					{...props}
				/>
				<InputGroupAddon>
					<SearchIcon className="size-4 shrink-0 opacity-50" />
				</InputGroupAddon>
			</InputGroup>
		</div>
	)
}

function CommandList({ className, ...props }) {
	return (
		<CommandPrimitive.List
			data-slot="command-list"
			className={cn(
				"no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
				className
			)}
			{...props}
		/>
	)
}

function CommandEmpty({ className, ...props }) {
	return (
		<CommandPrimitive.Empty
			data-slot="command-empty"
			className={cn("py-6 text-center text-sm", className)}
			{...props}
		/>
	)
}

function CommandGroup({ className, ...props }) {
	return (
		<CommandPrimitive.Group
			data-slot="command-group"
			className={cn(
				"text-oklch(0.145 0 0) **:[[cmdk-group-heading]]:text-oklch(0.556 0 0) dark:text-oklch(0.985 0 0) dark:**:[[cmdk-group-heading]]:text-oklch(0.708 0 0) overflow-hidden p-1 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium",
				className
			)}
			{...props}
		/>
	)
}

function CommandSeparator({ className, ...props }) {
	return (
		<CommandPrimitive.Separator
			data-slot="command-separator"
			className={cn(
				"bg-oklch(0.922 0 0) dark:bg-oklch(1 0 0 / 10%) -mx-1 h-px",
				className
			)}
			{...props}
		/>
	)
}

function CommandItem({ className, children, ...props }) {
	return (
		<CommandPrimitive.Item
			data-slot="command-item"
			className={cn(
				"group/command-item data-selected:bg-oklch(0.97 0 0) data-selected:text-oklch(0.145 0 0) data-selected:*:[svg]:text-oklch(0.145 0 0) dark:data-selected:bg-oklch(0.269 0 0) dark:data-selected:text-oklch(0.985 0 0) dark:data-selected:*:[svg]:text-oklch(0.985 0 0) relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className
			)}
			{...props}
		>
			{children}
			<CheckIcon className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
		</CommandPrimitive.Item>
	)
}

function CommandShortcut({ className, ...props }) {
	return (
		<span
			data-slot="command-shortcut"
			className={cn(
				"text-oklch(0.556 0 0) group-data-selected/command-item:text-oklch(0.145 0 0) dark:text-oklch(0.708 0 0) dark:group-data-selected/command-item:text-oklch(0.985 0 0) ml-auto text-xs tracking-widest",
				className
			)}
			{...props}
		/>
	)
}

export {
	Command,
	CommandDialog,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandShortcut,
	CommandSeparator,
}

"use client"

import * as React from "react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { CheckIcon, ChevronRightIcon } from "lucide-react"

function DropdownMenu({ ...props }) {
	return (
		<DropdownMenuPrimitive.Root
			data-slot="dropdown-menu"
			{...props}
		/>
	)
}

function DropdownMenuPortal({ ...props }) {
	return (
		<DropdownMenuPrimitive.Portal
			data-slot="dropdown-menu-portal"
			{...props}
		/>
	)
}

function DropdownMenuTrigger({ ...props }) {
	return (
		<DropdownMenuPrimitive.Trigger
			data-slot="dropdown-menu-trigger"
			{...props}
		/>
	)
}

function DropdownMenuContent({
	className,
	align = "start",
	sideOffset = 4,
	...props
}) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				data-slot="dropdown-menu-content"
				sideOffset={sideOffset}
				align={align}
				className={cn(
					"bg-oklch(1 0 0) text-oklch(0.145 0 0) ring-oklch(0.145 0 0)/10 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 dark:bg-oklch(0.205 0 0) dark:text-oklch(0.985 0 0) dark:ring-oklch(0.985 0 0)/10 z-50 max-h-(--radix-dropdown-menu-content-available-height) w-(--radix-dropdown-menu-trigger-width) min-w-32 origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg p-1 shadow-md ring-1 duration-100 data-[state=closed]:overflow-hidden",
					className
				)}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	)
}

function DropdownMenuGroup({ ...props }) {
	return (
		<DropdownMenuPrimitive.Group
			data-slot="dropdown-menu-group"
			{...props}
		/>
	)
}

function DropdownMenuItem({ className, inset, variant = "default", ...props }) {
	return (
		<DropdownMenuPrimitive.Item
			data-slot="dropdown-menu-item"
			data-inset={inset}
			data-variant={variant}
			className={cn(
				"group/dropdown-menu-item focus:bg-oklch(0.97 0 0) focus:text-oklch(0.205 0 0) not-data-[variant=destructive]:focus:**:text-oklch(0.205 0 0) data-[variant=destructive]:text-oklch(0.577 0.245 27.325) data-[variant=destructive]:focus:bg-oklch(0.577 0.245 27.325)/10 data-[variant=destructive]:focus:text-oklch(0.577 0.245 27.325) dark:data-[variant=destructive]:focus:bg-oklch(0.577 0.245 27.325)/20 data-[variant=destructive]:*:[svg]:text-oklch(0.577 0.245 27.325) dark:focus:bg-oklch(0.269 0 0) dark:focus:text-oklch(0.985 0 0) dark:not-data-[variant=destructive]:focus:**:text-oklch(0.985 0 0) dark:data-[variant=destructive]:text-oklch(0.704 0.191 22.216) dark:data-[variant=destructive]:focus:bg-oklch(0.704 0.191 22.216)/10 dark:data-[variant=destructive]:focus:text-oklch(0.704 0.191 22.216) dark:dark:data-[variant=destructive]:focus:bg-oklch(0.704 0.191 22.216)/20 dark:data-[variant=destructive]:*:[svg]:text-oklch(0.704 0.191 22.216) relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-7 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className
			)}
			{...props}
		/>
	)
}

function DropdownMenuCheckboxItem({
	className,
	children,
	checked,
	inset,
	...props
}) {
	return (
		<DropdownMenuPrimitive.CheckboxItem
			data-slot="dropdown-menu-checkbox-item"
			data-inset={inset}
			className={cn(
				"focus:bg-oklch(0.97 0 0) focus:text-oklch(0.205 0 0) focus:**:text-oklch(0.205 0 0) dark:focus:bg-oklch(0.269 0 0) dark:focus:text-oklch(0.985 0 0) dark:focus:**:text-oklch(0.985 0 0) relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-7 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className
			)}
			checked={checked}
			{...props}
		>
			<span
				className="pointer-events-none absolute right-2 flex items-center justify-center"
				data-slot="dropdown-menu-checkbox-item-indicator"
			>
				<DropdownMenuPrimitive.ItemIndicator>
					<CheckIcon />
				</DropdownMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</DropdownMenuPrimitive.CheckboxItem>
	)
}

function DropdownMenuRadioGroup({ ...props }) {
	return (
		<DropdownMenuPrimitive.RadioGroup
			data-slot="dropdown-menu-radio-group"
			{...props}
		/>
	)
}

function DropdownMenuRadioItem({ className, children, inset, ...props }) {
	return (
		<DropdownMenuPrimitive.RadioItem
			data-slot="dropdown-menu-radio-item"
			data-inset={inset}
			className={cn(
				"focus:bg-oklch(0.97 0 0) focus:text-oklch(0.205 0 0) focus:**:text-oklch(0.205 0 0) dark:focus:bg-oklch(0.269 0 0) dark:focus:text-oklch(0.985 0 0) dark:focus:**:text-oklch(0.985 0 0) relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-7 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className
			)}
			{...props}
		>
			<span
				className="pointer-events-none absolute right-2 flex items-center justify-center"
				data-slot="dropdown-menu-radio-item-indicator"
			>
				<DropdownMenuPrimitive.ItemIndicator>
					<CheckIcon />
				</DropdownMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</DropdownMenuPrimitive.RadioItem>
	)
}

function DropdownMenuLabel({ className, inset, ...props }) {
	return (
		<DropdownMenuPrimitive.Label
			data-slot="dropdown-menu-label"
			data-inset={inset}
			className={cn(
				"text-oklch(0.556 0 0) dark:text-oklch(0.708 0 0) px-1.5 py-1 text-xs font-medium data-inset:pl-7",
				className
			)}
			{...props}
		/>
	)
}

function DropdownMenuSeparator({ className, ...props }) {
	return (
		<DropdownMenuPrimitive.Separator
			data-slot="dropdown-menu-separator"
			className={cn(
				"bg-oklch(0.922 0 0) dark:bg-oklch(1 0 0 / 10%) -mx-1 my-1 h-px",
				className
			)}
			{...props}
		/>
	)
}

function DropdownMenuShortcut({ className, ...props }) {
	return (
		<span
			data-slot="dropdown-menu-shortcut"
			className={cn(
				"text-oklch(0.556 0 0) group-focus/dropdown-menu-item:text-oklch(0.205 0 0) dark:text-oklch(0.708 0 0) dark:group-focus/dropdown-menu-item:text-oklch(0.985 0 0) ml-auto text-xs tracking-widest",
				className
			)}
			{...props}
		/>
	)
}

function DropdownMenuSub({ ...props }) {
	return (
		<DropdownMenuPrimitive.Sub
			data-slot="dropdown-menu-sub"
			{...props}
		/>
	)
}

function DropdownMenuSubTrigger({ className, inset, children, ...props }) {
	return (
		<DropdownMenuPrimitive.SubTrigger
			data-slot="dropdown-menu-sub-trigger"
			data-inset={inset}
			className={cn(
				"focus:bg-oklch(0.97 0 0) focus:text-oklch(0.205 0 0) not-data-[variant=destructive]:focus:**:text-oklch(0.205 0 0) data-open:bg-oklch(0.97 0 0) data-open:text-oklch(0.205 0 0) dark:focus:bg-oklch(0.269 0 0) dark:focus:text-oklch(0.985 0 0) dark:not-data-[variant=destructive]:focus:**:text-oklch(0.985 0 0) dark:data-open:bg-oklch(0.269 0 0) dark:data-open:text-oklch(0.985 0 0) flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none data-inset:pl-7 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className
			)}
			{...props}
		>
			{children}
			<ChevronRightIcon className="ml-auto" />
		</DropdownMenuPrimitive.SubTrigger>
	)
}

function DropdownMenuSubContent({ className, ...props }) {
	return (
		<DropdownMenuPrimitive.SubContent
			data-slot="dropdown-menu-sub-content"
			className={cn(
				"bg-oklch(1 0 0) text-oklch(0.145 0 0) ring-oklch(0.145 0 0)/10 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 dark:bg-oklch(0.205 0 0) dark:text-oklch(0.985 0 0) dark:ring-oklch(0.985 0 0)/10 z-50 min-w-[96px] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-lg p-1 shadow-lg ring-1 duration-100",
				className
			)}
			{...props}
		/>
	)
}

export {
	DropdownMenu,
	DropdownMenuPortal,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
}

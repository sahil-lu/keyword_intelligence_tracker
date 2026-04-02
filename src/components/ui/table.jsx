"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }) {
	return (
		<div
			data-slot="table-container"
			className="relative w-full overflow-x-auto"
		>
			<table
				data-slot="table"
				className={cn("w-full caption-bottom text-sm", className)}
				{...props}
			/>
		</div>
	)
}

function TableHeader({ className, ...props }) {
	return (
		<thead
			data-slot="table-header"
			className={cn("[&_tr]:border-b", className)}
			{...props}
		/>
	)
}

function TableBody({ className, ...props }) {
	return (
		<tbody
			data-slot="table-body"
			className={cn("[&_tr:last-child]:border-0", className)}
			{...props}
		/>
	)
}

function TableFooter({ className, ...props }) {
	return (
		<tfoot
			data-slot="table-footer"
			className={cn(
				"bg-oklch(0.97 0 0)/50 dark:bg-oklch(0.269 0 0)/50 border-t font-medium [&>tr]:last:border-b-0",
				className
			)}
			{...props}
		/>
	)
}

function TableRow({ className, ...props }) {
	return (
		<tr
			data-slot="table-row"
			className={cn(
				"hover:bg-oklch(0.97 0 0)/50 data-[state=selected]:bg-oklch(0.97 0 0) dark:hover:bg-oklch(0.269 0 0)/50 dark:data-[state=selected]:bg-oklch(0.269 0 0) border-b transition-colors",
				className
			)}
			{...props}
		/>
	)
}

function TableHead({ className, ...props }) {
	return (
		<th
			data-slot="table-head"
			className={cn(
				"text-oklch(0.145 0 0) dark:text-oklch(0.985 0 0) h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0",
				className
			)}
			{...props}
		/>
	)
}

function TableCell({ className, ...props }) {
	return (
		<td
			data-slot="table-cell"
			className={cn(
				"p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
				className
			)}
			{...props}
		/>
	)
}

function TableCaption({ className, ...props }) {
	return (
		<caption
			data-slot="table-caption"
			className={cn(
				"text-oklch(0.556 0 0) dark:text-oklch(0.708 0 0) mt-4 text-sm",
				className
			)}
			{...props}
		/>
	)
}

export {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableHead,
	TableRow,
	TableCell,
	TableCaption,
}

"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Avatar({ className, size = "default", ...props }) {
	return (
		<AvatarPrimitive.Root
			data-slot="avatar"
			data-size={size}
			className={cn(
				"group/avatar after:border-oklch(0.922 0 0) dark:after:border-oklch(1 0 0 / 10%) relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten",
				className
			)}
			{...props}
		/>
	)
}

function AvatarImage({ className, ...props }) {
	return (
		<AvatarPrimitive.Image
			data-slot="avatar-image"
			className={cn(
				"aspect-square size-full rounded-full object-cover",
				className
			)}
			{...props}
		/>
	)
}

function AvatarFallback({ className, ...props }) {
	return (
		<AvatarPrimitive.Fallback
			data-slot="avatar-fallback"
			className={cn(
				"bg-oklch(0.97 0 0) text-oklch(0.556 0 0) dark:bg-oklch(0.269 0 0) dark:text-oklch(0.708 0 0) flex size-full items-center justify-center rounded-full text-sm group-data-[size=sm]/avatar:text-xs",
				className
			)}
			{...props}
		/>
	)
}

function AvatarBadge({ className, ...props }) {
	return (
		<span
			data-slot="avatar-badge"
			className={cn(
				"bg-oklch(0.205 0 0) text-oklch(0.985 0 0) ring-oklch(1 0 0) dark:bg-oklch(0.922 0 0) dark:text-oklch(0.205 0 0) dark:ring-oklch(0.145 0 0) absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-blend-color ring-2 select-none",
				"group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
				"group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
				"group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
				className
			)}
			{...props}
		/>
	)
}

function AvatarGroup({ className, ...props }) {
	return (
		<div
			data-slot="avatar-group"
			className={cn(
				"group/avatar-group *:data-[slot=avatar]:ring-oklch(1 0 0) dark:*:data-[slot=avatar]:ring-oklch(0.145 0 0) flex -space-x-2 *:data-[slot=avatar]:ring-2",
				className
			)}
			{...props}
		/>
	)
}

function AvatarGroupCount({ className, ...props }) {
	return (
		<div
			data-slot="avatar-group-count"
			className={cn(
				"bg-oklch(0.97 0 0) text-oklch(0.556 0 0) ring-oklch(1 0 0) dark:bg-oklch(0.269 0 0) dark:text-oklch(0.708 0 0) dark:ring-oklch(0.145 0 0) relative flex size-8 shrink-0 items-center justify-center rounded-full text-sm ring-2 group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
				className
			)}
			{...props}
		/>
	)
}

export {
	Avatar,
	AvatarImage,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
	AvatarBadge,
}

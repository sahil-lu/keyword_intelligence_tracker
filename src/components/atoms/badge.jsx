import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import React from "react";

const badgeVariants = cva(
	"inline-flex items-center gap-1 rounded-md h-5 px-1.5 py-0.5 font-medium ring-1 ring-inset capitalize whitespace-nowrap text-2xs",
	{
		variants: {
			variant: {
				transparent:
					"bg-transparent text-neutral-600 ring-transparent dark:text-neutral-400",
				slate: "bg-slate-50 text-slate-600 ring-slate-500/10 dark:bg-slate-400/10 dark:text-slate-400 dark:ring-slate-400/20",
				gray: "bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20",
				zinc: "bg-zinc-50 text-zinc-600 ring-zinc-500/10 dark:bg-zinc-400/10 dark:text-zinc-400 dark:ring-zinc-400/20",
				neutral:
					"bg-neutral-50 text-neutral-600 ring-neutral-500/10 dark:bg-neutral-400/10 dark:text-neutral-400 dark:ring-neutral-400/20",
				stone: "bg-stone-50 text-stone-600 ring-stone-500/10 dark:bg-stone-400/10 dark:text-stone-400 dark:ring-stone-400/20",
				red: "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20",
				rose: "bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-400/10 dark:text-rose-400 dark:ring-rose-400/20",
				orange: "bg-orange-50 text-orange-800 ring-orange-600/20 dark:bg-orange-400/10 dark:text-orange-500 dark:ring-orange-400/20",
				amber: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-500 dark:ring-amber-400/20",
				yellow: "bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:ring-yellow-400/20",
				lime: "bg-lime-50 text-lime-700 ring-lime-600/20 dark:bg-lime-500/10 dark:text-lime-400 dark:ring-lime-500/20",
				green: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20",
				emerald:
					"bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
				teal: "bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-400 dark:ring-teal-500/20",
				cyan: "bg-cyan-50 text-cyan-700 ring-cyan-700/10 dark:bg-cyan-400/10 dark:text-cyan-400 dark:ring-cyan-400/30",
				sky: "bg-sky-50 text-sky-700 ring-sky-700/10 dark:bg-sky-400/10 dark:text-sky-400 dark:ring-sky-400/30",
				blue: "bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30",
				indigo: "bg-indigo-50 text-indigo-700 ring-indigo-700/10 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/30",
				violet: "bg-violet-50 text-violet-700 ring-violet-700/10 dark:bg-violet-400/10 dark:text-violet-400 dark:ring-violet-400/30",
				purple: "bg-purple-50 text-purple-700 ring-purple-700/10 dark:bg-purple-400/10 dark:text-purple-400 dark:ring-purple-400/30",
				fuchsia:
					"bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-700/10 dark:bg-fuchsia-400/10 dark:text-fuchsia-400 dark:ring-fuchsia-400/30",
				pink: "bg-pink-50 text-pink-700 ring-pink-700/10 dark:bg-pink-400/10 dark:text-pink-400 dark:ring-pink-400/20",
			},
			selectable: {
				true: "select-text",
				false: "select-none",
			},
			capitalize: {
				true: "capitalize",
				false: "",
			},
		},
		compoundVariants: [
			{
				variant: "transparent",
				class: "p-0",
			},
		],
		defaultVariants: {
			variant: "gray",
			selectable: false,
			capitalize: true,
		},
	}
);

const Badge = ({
	children,
	variant,
	className,
	selectable,
	capitalize,
	...props
}) => (
	<span
		className={cn(
			badgeVariants({ variant, selectable, capitalize }),
			className
		)}
		{...props}
	>
		{children}
	</span>
);

export default Badge;

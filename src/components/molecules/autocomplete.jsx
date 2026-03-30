"use client"

import { searchCity } from "@/actions/auth"
import Badge from "@/atoms/badge"
import { cn, getNestedValue, getType } from "@/lib/utils"
import { Command, CommandGroup, CommandItem, CommandList } from "@/ui/command"
import {
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/ui/form"
import { Command as CommandPrimitive } from "cmdk"
import { Check, X } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDebounce } from "use-debounce"

const hooks = {
	location: {
		get: searchCity,
	},
}

const Autocomplete = ({
	form,
	name,
	label,
	description,
	placeholder,
	multiple = false,
	options,
	apiBased = false,
	asDefault = false,
	searchKey = "_id",
	instance = "company",
	filterKeys = ["_id"],
	onSelect = () => {},
	onUnselect = () => {},
}) => {
	const inputRef = useRef(null)
	const [open, setOpen] = useState(false)

	const [apiOptions, setApiOptions] = useState(null)
	const [isFetching, setIsFetching] = useState(null)

	const [selectedOptions, setSelectedOptions] = useState([])
	const [inputValue, setInputValue] = useState()
	const [queryValue, setQueryValue] = useState("")
	const [query] = useDebounce(queryValue, 1000)

	const { get } = hooks[instance] ?? {
		get: () => false,
		add: () => false,
	}

	useEffect(() => {
		if (apiBased) {
			setIsFetching(true)
			get({ query })
				.then(({ data }) => setApiOptions(data))
				.finally(() => {
					setIsFetching(false)
				})
		}
	}, [apiBased, get, query])

	const formValue = form.watch(name)

	const handleInputChange = value => {
		setInputValue(value)
		setQueryValue(value)
	}

	const handleUnselect = useCallback(
		field => option => onUnselect(field.value, option),
		[onUnselect]
	)

	const handleKeyDown = useCallback(
		field => e => {
			const input = inputRef.current
			if (input) {
				if (e.key === "Backspace") {
					if (multiple) {
						if (input.value.trim().length === 0)
							field.onChange(
								[...(field.value || [])].slice(0, -1)
							)
					} else {
						field.onChange("")
						setQueryValue("")
					}
				} else if (e.key === "Escape") input.blur()
			}
		},

		[multiple]
	)

	const handleSelect = useCallback(
		field => option => {
			setInputValue("")

			onSelect(field.value, option)
			if (multiple) setSelectedOptions(prev => [...prev, option])

			const input = inputRef.current
			if (!multiple && input) input.blur()
		},
		[multiple, onSelect]
	)

	const optionsToUse = useMemo(
		() => (apiBased ? apiOptions : options) || [],
		[apiBased, apiOptions, options]
	)

	const getOption = val =>
		[...optionsToUse, ...(selectedOptions ?? [])].find(
			option =>
				option.title === (getType(val) === "Object" ? val.title : val)
		)

	const getLabel = useCallback(
		val =>
			[...optionsToUse, ...(selectedOptions ?? [])].find(
				option =>
					option[searchKey] ===
					(getType(val) === "Object" ? val._id : val)
			)?.title,
		[selectedOptions, optionsToUse, searchKey]
	)

	const filteredOptions = useMemo(() => {
		if (apiBased) return optionsToUse
		return optionsToUse.filter(option => {
			return filterKeys.some(key => {
				const value = getNestedValue(option, key.split("."))
				return value
					?.toString()
					?.toLowerCase()
					.includes(query?.toLowerCase())
			})
		})
	}, [apiBased, optionsToUse, filterKeys, query])

	useEffect(() => {
		handleInputChange(
			multiple
				? ""
				: (asDefault
						? (formValue?.title ?? formValue)
						: getLabel(formValue)) || ""
		)
		if (multiple && asDefault && formValue) setSelectedOptions(formValue)

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formValue])

	return (
		<>
			<FormField
				control={form.control}
				name={name}
				render={({ field }) => {
					const valueLabel = multiple
						? (field.value || []).map(getLabel).filter(Boolean)
						: getLabel(field.value)
					const valueOption = multiple
						? (field.value || []).map(getOption).filter(Boolean)
						: getOption(field.value)

					const value = multiple
						? inputValue
						: (valueLabel ?? inputValue)

					return (
						<FormItem
							className={cn(label && description && "gap-2")}
						>
							<div className="flex flex-col gap-1">
								{label ? <FormLabel>{label}</FormLabel> : null}
								{description ? (
									<FormDescription>
										{description}
									</FormDescription>
								) : null}
							</div>
							<Command
								shouldFilter={false}
								className="overflow-visible bg-transparent"
							>
								<div className="flex w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300">
									<div className="flex w-full flex-wrap gap-2">
										{multiple &&
											valueOption?.map(option => (
												<Badge key={option._id}>
													{instance === "skill" &&
														option.icon && (
															<span className="relative h-3.5 w-3.5">
																<Image
																	src={
																		option.icon
																	}
																	alt={
																		option.title
																	}
																	fill
																/>
															</span>
														)}
													{option.title}
													<button
														type="button"
														className="ring-offset-white focus:ring-neutral-400 ml-1 rounded-full outline-hidden focus:ring-2 focus:ring-offset-2"
														onMouseDown={e => {
															e.preventDefault()
															e.stopPropagation()
														}}
														onClick={() =>
															handleUnselect(
																field
															)(option)
														}
													>
														<X className="hover:text-neutral-900 h-3 w-3 text-neutral-500" />
													</button>
												</Badge>
											))}
										<CommandPrimitive.Input
											ref={inputRef}
											value={value}
											onValueChange={handleInputChange}
											onKeyDown={handleKeyDown(field)}
											onBlur={() => setOpen(false)}
											onFocus={() => {
												setOpen(true)
											}}
											placeholder={placeholder}
											className="h-5 flex-1 bg-transparent outline-hidden placeholder:text-neutral-500"
										/>
									</div>
								</div>
								<div className="relative mt-2">
									<CommandList>
										{open && queryValue ? (
											<div className="animate-in absolute top-0 z-20 max-h-96 w-full min-w-[8rem] overflow-hidden rounded-md border border-neutral-200 bg-white p-1 text-neutral-950 shadow-md outline-hidden dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50">
												{isFetching ? (
													<div className="relative flex w-full cursor-default items-center rounded-xs py-1.5 pr-2 pl-8 text-sm select-none">
														Searching...
													</div>
												) : filteredOptions.length >
												  0 ? (
													<CommandGroup className="h-full overflow-auto p-0">
														{filteredOptions.map(
															option => {
																const isSelected =
																	multiple
																		? valueLabel?.includes(
																				option.title
																			)
																		: valueLabel ===
																			option.title
																return (
																	<CommandItem
																		key={
																			option._id
																		}
																		onMouseDown={e => {
																			e.preventDefault()
																			e.stopPropagation()
																		}}
																		onSelect={() =>
																			handleSelect(
																				field
																			)(
																				option
																			)
																		}
																		className="relative flex w-full cursor-default items-center gap-2 rounded-xs py-1.5 pr-2 pl-8 text-sm select-none"
																	>
																		{isSelected ? (
																			<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
																				<Check className="h-4 w-4" />
																			</span>
																		) : null}
																		{instance ===
																			"skill" &&
																			option.icon && (
																				<span className="relative h-3.5 w-3.5">
																					<Image
																						src={
																							option.icon
																						}
																						alt={
																							option.title
																						}
																						fill
																					/>
																				</span>
																			)}
																		{
																			option.title
																		}
																	</CommandItem>
																)
															}
														)}
													</CommandGroup>
												) : (
													<div className="relative flex w-full cursor-default items-center rounded-xs py-1.5 pr-2 pl-8 text-sm select-none">
														No results found
													</div>
												)}
											</div>
										) : null}
									</CommandList>
								</div>
							</Command>
							<FormMessage />
						</FormItem>
					)
				}}
			/>
		</>
	)
}

export default Autocomplete

"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/ui/button"
import { Calendar } from "@/ui/calendar"
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select"
import { addMonths, format, setMonth, setYear, subYears } from "date-fns"
import { CalendarIcon } from "lucide-react"

const months = Array.from({ length: 12 }, (_, i) =>
	format(addMonths(new Date(2020, 0, 1), i), "MMMM")
)

const years = Array.from({ length: 100 }, (_, i) =>
	Number(format(subYears(new Date(), i), "yyyy"))
)

const DatePicker = ({ form, name, label }) => {
	const handleChange = (field, type) => val => {
		const date = field.value ?? new Date()
		const modifier = type === "month" ? setMonth : setYear
		field.onChange(type === "date" ? val : modifier(date, Number(val)))
	}

	return (
		<div className="flex h-fit">
			<FormField
				control={form.control}
				name={name}
				render={({ field }) => {
					const dateValue = field.value
						? new Date(field.value)
						: new Date()
					return (
						<FormItem className="flex flex-1 flex-col">
							<FormLabel>{label}</FormLabel>
							<Popover>
								<PopoverTrigger asChild>
									<FormControl>
										<Button
											variant={"outline"}
											className={cn(
												"w-full pl-3 text-left font-normal",
												field.value
													? ""
													: "text-slate-500"
											)}
										>
											{field.value ? (
												format(field.value, "PP")
											) : (
												<span>Pick a date</span>
											)}
											<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
										</Button>
									</FormControl>
								</PopoverTrigger>
								<PopoverContent className="w-full max-w-sm">
									<div className="grid w-full grid-cols-2 gap-2">
										<div className="flex w-full">
											<Select
												defaultValue={`${dateValue.getMonth()}`}
												onValueChange={handleChange(
													field,
													"month"
												)}
											>
												<SelectTrigger>
													<SelectValue
														placeholder="Month"
														className="pl-2"
													/>
												</SelectTrigger>
												<SelectContent>
													{months.map((month, i) => (
														<SelectItem
															key={i}
															value={`${i}`}
														>
															{month}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="flex w-full">
											<Select
												defaultValue={`${dateValue.getFullYear()}`}
												onValueChange={handleChange(
													field,
													"year"
												)}
											>
												<SelectTrigger>
													<SelectValue
														placeholder="Year"
														className="pl-2"
													/>
												</SelectTrigger>
												<SelectContent>
													{years.map(year => (
														<SelectItem
															key={year}
															value={`${year}`}
														>
															{year}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<Calendar
											mode="single"
											selected={dateValue}
											onSelect={field.onChange}
										/>
									</div>
								</PopoverContent>
							</Popover>
							<FormMessage />
						</FormItem>
					)
				}}
			/>
		</div>
	)
}

export default DatePicker

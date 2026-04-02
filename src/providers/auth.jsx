"use client"

import {
	getProfile,
	reSendOTP,
	sendOTP,
	setProfile,
	verifyOTP,
} from "@/actions/auth"
import useMediaQuery from "@/hooks/useMediaQuery"
import { getType } from "@/lib/utils"
import Autocomplete from "@/molecules/autocomplete"
import cookieService from "@/services/cookie"
import useStore from "@/store"
import { Button } from "@/ui/button"
import { Dialog, DialogContent } from "@/ui/dialog"
import { Drawer, DrawerContent } from "@/ui/drawer"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/ui/form"
import { Input } from "@/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/ui/input-otp"
import { Label } from "@/ui/label"
import { zodResolver } from "@hookform/resolvers/zod"
// import * as Sentry from "@sentry/nextjs"
import IPData from "ipdata"
import { PencilIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const AUTO_AUTH_TIMER = 5 // in seconds

const AuthProvider = ({
	children,
	withPrompt = false,
	prompt = {
		closable: true,
		time: AUTO_AUTH_TIMER,
	},
	withForm = true,
}) => {
	const isAuthenticated = useStore(store => store.isAuthenticated)
	const launchCode = useStore(store => store.queryParams.launchCode)
	const dispatch = useStore(store => store.dispatch)

	useEffect(() => {
		if (isAuthenticated) return
		const token = cookieService.getToken("access") || launchCode

		if (token)
			getProfile(token).then(({ error, message, data: user }) => {
				if (error) {
					toast.error(message)
					return
				}
				dispatch({
					type: "SET_STATE",
					payload: {
						user,
						authId: null,
						openAuth: false,
						isAuthenticated: true,
						closableAuth: true,
					},
				})
			})
		else if (children)
			dispatch({
				type: "SET_STATE",
				payload: { openAuth: true, closableAuth: !children },
			})

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [launchCode])

	return (
		<>
			{children &&
				(isAuthenticated ? children : <div className="h-screen" />)}
			{withPrompt && <AuthPrompter {...prompt} />}
			{withForm && <AuthForm />}
		</>
	)
}

export default AuthProvider

export const useAuthPrompter = ({
	closable = true,
	time = AUTO_AUTH_TIMER,
}) => {
	const isAuthenticated = useStore(store => store.isAuthenticated)
	const dispatch = useStore(store => store.dispatch)

	useEffect(() => {
		if (!isAuthenticated) {
			const timer = setTimeout(() => {
				dispatch({
					type: "SET_STATE",
					payload: { openAuth: true, closableAuth: closable },
				})
			}, 1000 * time)

			return () => clearTimeout(timer)
		}
	}, [closable, dispatch, isAuthenticated, time])

	return null
}

export const AuthPrompter = useAuthPrompter

export const useAuthenticator = () => {
	const router = useRouter()

	const isAuthenticated = useStore(store => store.isAuthenticated)
	const dispatch = useStore(store => store.dispatch)

	const [callback, setCallback] = useState(null)

	const authenticate =
		({ cb, route }) =>
		e => {
			e?.preventDefault()

			if (route && !getType(cb).includes("Function"))
				cb = () => router.push(route)

			if (!isAuthenticated) {
				setCallback(() => cb)
				dispatch({
					type: "SET_STATE",
					payload: { openAuth: true, closableAuth: !cb },
				})
			} else {
				cb?.()
			}
		}

	useEffect(() => {
		if (isAuthenticated && callback) {
			callback()
			setCallback(null)
		}
	}, [isAuthenticated, callback])

	return { authenticate }
}

export const withAuth = WrappedComponent => {
	const WithAuth = props => {
		const isAuthenticated = useStore(store => store.isAuthenticated)
		const dispatch = useStore(store => store.dispatch)

		useEffect(() => {
			if (!isAuthenticated) {
				dispatch({
					type: "SET_STATE",
					payload: { openAuth: true, closableAuth: false },
				})
			}
		}, [isAuthenticated, dispatch])

		// If not authenticated, return null or you can return a loading state or redirect to login
		if (!isAuthenticated) return null

		// Return the wrapped component with the passed props
		return <WrappedComponent {...props} />
	}

	// Set display name for debugging purposes
	WithAuth.displayName = `WithAuth(${
		WrappedComponent.displayName || WrappedComponent.name || "Component"
	})`

	return WithAuth
}

export const AuthElement = ({
	as: Element = "button",
	href,
	onClick,
	children,
	...props
}) => {
	const { authenticate } = useAuthenticator()

	// Handle case where 'Link' is passed as the element type
	if (["a", "Link"].includes(Element)) {
		console.warn(
			"WARNING: Link is not supported in AuthElement and will be ignored"
		)
		return (
			<Element
				{...{
					href,
					onClick,
				}}
				{...props}
			>
				{children}
			</Element>
		)
	}

	// If the element is a 'Button', use the Button component
	if (Element === "Button") Element = Button

	const handleClick = e => {
		e.preventDefault()

		if (href) {
			authenticate({ route: href })(e)
		} else {
			authenticate(
				typeof onClick === "function" ? { cb: () => onClick(e) } : {}
			)(e)
		}
	}

	return (
		<Element
			onClick={handleClick}
			href={href}
			{...props}
		>
			{children}
		</Element>
	)
}

const AuthForm = () => {
	const authId = useStore(store => store.authId)
	const openAuth = useStore(store => store.openAuth)
	const closableAuth = useStore(store => store.closableAuth)
	const queryParams = useStore(store => store.queryParams)
	const dispatch = useStore(store => store.dispatch)

	const [loading, setLoading] = useState(false)
	const [phoneNumber, setPhoneNumber] = useState({
		phoneNumber: "",
	})
	const [type, setType] = useState(0)

	const editNumber = () => setType(0)

	const isMD = useMediaQuery("(min-width: 768px)")

	const closeAuth = () =>
		type === 0 && closableAuth
			? dispatch({
					type: "SET_STATE",
					payload: { openAuth: false },
				})
			: undefined

	const handlePostVerification = async token => {
		const { error, message, data: user } = await getProfile(token)

		if (error) {
			toast.error(message)
			return
		}

		// const userMetaData = user
		// Sentry.setUser(userMetaData)

		dispatch({
			type: "SET_STATE",
			payload: {
				user,
				authId: null,
				openAuth: false,
				isAuthenticated: true,
				closableAuth: true,
			},
		})
		setTimeout(() => {
			setType(0)
		}, 500)
	}

	const onSubmit = values => {
		setLoading(true)

		const handleOTP = () => {
			setPhoneNumber(values)
			sendOTP({
				...values,
				utm: queryParams,
			})
				.then(({ error, message, data }) => {
					setLoading(false)
					if (error) {
						toast.error(message)
						return
					}

					toast.info(OTP_ATTEMPTS[0].message)
					dispatch({
						type: "SET_STATE",
						payload: { authId: data },
					})
					setType(1)
				})
				.catch(e => {
					console.error(e)
					setLoading(false)
				})
		}

		const handleVerifyOTP = () => {
			verifyOTP({ ...values, id: authId, ...phoneNumber })
				.then(({ error, message, data }) => {
					setLoading(false)
					if (error) {
						toast.error(message)
						return
					}

					const token = data.token

					cookieService.setTokens({
						accessToken: token,
					})

					if (data.isNew) setType(2)
					else handlePostVerification(token)
				})
				.catch(e => {
					console.error(e)
					setLoading(false)
				})
		}

		const handleProfileUpdate = () => {
			const location = values.location
			delete values.location

			const [city, state, country] = location.split(", ")

			values.location = {
				city,
				state,
				country,
			}

			setProfile(values)
				.then(({ error, message }) => {
					setLoading(false)
					if (error) {
						toast.error(message)
						return
					}

					handlePostVerification()
				})
				.catch(e => {
					console.error(e)
					setLoading(false)
				})
		}

		;(type === 0
			? handleOTP
			: type === 1
				? handleVerifyOTP
				: handleProfileUpdate)()
	}

	const Form = [PhoneForm, OTPForm, RegisterForm][type]

	return isMD ? (
		<Dialog
			open={openAuth}
			onOpenChange={closeAuth}
		>
			<DialogContent
				className="px-0 py-8 sm:max-w-[425px]"
				closable={type === 0 || closableAuth}
			>
				<Form
					onSubmit={onSubmit}
					loading={loading}
					phoneNumber={phoneNumber}
					editNumber={editNumber}
				/>
			</DialogContent>
		</Dialog>
	) : (
		<Drawer
			open={openAuth}
			onOpenChange={closeAuth}
		>
			<DrawerContent className="flex flex-col items-center gap-6 px-0 py-8">
				<Form
					onSubmit={onSubmit}
					loading={loading}
					phoneNumber={phoneNumber}
					editNumber={editNumber}
				/>
			</DrawerContent>
		</Drawer>
	)
}

const PhoneForm = ({ onSubmit, loading, phoneNumber }) => {
	const form = useForm({
		resolver: zodResolver(numberSchema),
		defaultValues: phoneNumber,
	})

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex w-full flex-col gap-6 overflow-x-hidden"
			>
				<div className="flex flex-col gap-2">
					<div className="flex flex-col gap-4 px-8">
						<div className="relative aspect-[2.8/1] w-32">
							<Image
								src="/logo.png"
								alt="12th Class"
								fill
							/>
						</div>
						<div className="flex flex-col">
							<div className="text-lg font-bold text-blue-600">
								Login
							</div>
							<div className="text-sm text-slate-500">
								Get unlimited resources for free
							</div>
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-4 px-8">
					<div className="flex flex-col gap-1.5">
						<Label>Enter mobile number</Label>
						<FormField
							control={form.control}
							name="phoneNumber"
							render={({ field }) => (
								<FormItem className="flex-1">
									<FormControl>
										<Input
											placeholder="9876543210"
											type="number"
											{...field}
											className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-0"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<Button
						rounded
						type="submit"
						disabled={loading || !form.formState.isValid}
					>
						{loading ? "Loading..." : "Continue"}
					</Button>
					<div className="flex items-center justify-center gap-1 text-xs text-slate-500">
						By continuing, you agree to our{" "}
						<Link
							href="/privacy"
							className="underline decoration-dotted hover:decoration-solid"
						>
							Privacy policy
						</Link>
					</div>
				</div>
			</form>
		</Form>
	)
}

const OTPForm = ({ onSubmit, loading, phoneNumber, editNumber }) => {
	const authId = useStore(store => store.authId)

	const [resendAttempt, setResendAttempt] = useState(1)
	const [resendIn, setResendIn] = useState(OTP_TIMER)
	const resendIntervalRef =
		(useRef < NodeJS.Timeout) | (undefined > undefined)
	const resendTimerRef = (useRef < NodeJS.Timeout) | (undefined > undefined)

	const form = useForm({
		resolver: zodResolver(otpSchema),
	})

	const resetResendIn = stop => {
		clearInterval(resendIntervalRef.current)
		clearTimeout(resendTimerRef.current)
		if (!stop) setResendIn(OTP_TIMER)
		else setResendIn(0)
	}

	const handleResendIn = () => {
		resetResendIn()
		resendIntervalRef.current = setInterval(() => {
			setResendIn(prev => prev - 1000)
		}, 1000)
		resendTimerRef.current = setTimeout(() => {
			resetResendIn(true)
		}, OTP_TIMER)
	}

	const resendOTP =
		(call = false) =>
		() => {
			toast.info(
				OTP_ATTEMPTS[resendAttempt][call ? "callMessage" : "message"]
			)
			reSendOTP({
				id: authId,
				retryType: call ? "call" : "text",
				...phoneNumber,
			}).then(({ error, message }) => {
				if (error) {
					toast.error(message)
					return
				}

				setResendAttempt(prev => prev + 1)
				handleResendIn()
			})
		}

	useEffect(() => {
		handleResendIn()
		return () => {
			resetResendIn(true)
			clearTimeout(resendTimerRef.current)
			clearInterval(resendIntervalRef.current)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex w-full flex-col gap-6 overflow-x-hidden"
			>
				<div className="flex flex-col gap-2">
					<div className="flex flex-col gap-4 px-8">
						<div className="relative aspect-[2.8/1] w-32">
							<Image
								src="/logo.png"
								alt="12th Class"
								fill
							/>
						</div>
						<div className="flex flex-col text-sm">
							<span className="text-lg font-bold text-blue-600">
								Verify
							</span>
							<span className="text-slate-500">
								Enter the “4-digit OTP” to received via SMS on
								the{" "}
								<span className="inline-flex gap-1">
									number{" "}
									<span className="flex items-center justify-center gap-1 font-semibold">
										{phoneNumber.phoneNumber}{" "}
										<PencilIcon
											className="h-3 w-3 cursor-pointer"
											onClick={editNumber}
										/>
									</span>
								</span>
							</span>
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-4 px-8">
					<FormField
						control={form.control}
						name="otp"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Enter OTP received</FormLabel>
								<FormControl>
									<InputOTP
										maxLength={4}
										{...field}
										onComplete={form.handleSubmit(onSubmit)}
									>
										{Array.from({ length: 4 }, (_, i) => (
											<InputOTPGroup key={i}>
												<InputOTPSlot
													className="size-12 text-base"
													index={i}
												/>
											</InputOTPGroup>
										))}
									</InputOTP>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					{resendAttempt < OTP_ATTEMPTS.length ? (
						<div className="flex items-center justify-between text-xs">
							<button
								type="button"
								disabled={!!resendIn}
								className="cursor-pointer disabled:cursor-not-allowed"
								onClick={resendOTP()}
							>
								Resend OTP{" "}
								{resendIn ? (
									<>
										in{" "}
										<span className="font-semibold">
											{resendIn / 1000}s
										</span>
									</>
								) : null}
							</button>
							{resendIn ? null : (
								<button
									type="button"
									disabled={!!resendIn}
									className="cursor-pointer disabled:cursor-not-allowed"
									onClick={resendOTP(true)}
								>
									Retry via call
								</button>
							)}
						</div>
					) : null}
					<Button
						rounded
						type="submit"
						disabled={loading || !form.formState.isValid}
					>
						{loading ? "Loading..." : "Verify"}
					</Button>
				</div>
			</form>
		</Form>
	)
}

const RegisterForm = ({ onSubmit, loading }) => {
	const form = useForm({
		resolver: zodResolver(registerSchema),
		defaultValues: async () => {
			if (!process.env.NEXT_PUBLIC_IPDATA_API_KEY) return {}

			const ipdata = new IPData(process.env.NEXT_PUBLIC_IPDATA_API_KEY)
			const ipInfo = await ipdata.lookup()

			return {
				name: undefined,
				email: undefined,
				location: [ipInfo.city, ipInfo.region, ipInfo.country_code]
					.filter(Boolean)
					.join(", "),
			}
		},
	})

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex w-full flex-col gap-6 overflow-x-hidden"
			>
				<div className="flex flex-col gap-2">
					<div className="flex flex-col gap-4 px-8">
						<div className="relative aspect-[2.8/1] w-32">
							<Image
								src="/logo.png"
								alt="12th Class"
								fill
							/>
						</div>
						<div className="flex flex-col">
							<div className="text-lg font-semibold text-blue-600">
								Last Step
							</div>
							<div className="text-sm text-slate-500">
								Complete your account creation on 12thClass by
								helping us with your details
							</div>
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-4 px-8">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input
										placeholder="John Doe"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										placeholder="john@example.com"
										type="email"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Autocomplete
						form={form}
						name="location"
						label="Enter your city"
						placeholder="Search by city name"
						apiBased
						asDefault
						searchKey="title"
						instance="location"
						onSelect={(values, option) => {
							form.setValue("location", option.title)
						}}
					/>
					<Button
						rounded
						type="submit"
						disabled={loading || !form.formState.isValid}
					>
						{loading ? "Loading..." : "Done"}
					</Button>
				</div>
			</form>
		</Form>
	)
}

const OTP_TIMER = 1000 * 60 * 0.5
const OTP_ATTEMPTS = [
	{ step: "send", message: "OTP sent successfully over SMS." },
	{
		step: "resend1",
		message: "OTP resent. Please check your messages.",
		callMessage: "OTP resent via call. Stay tuned for the call..",
	},
	{
		step: "resend2",
		message: "OTP resent again. Kindly check your messages.",
		callMessage: "OTP resent again via call. Stay tuned for the call.",
	},
]

const numberSchema = z.object({
	phoneNumber: z.string().length(10, {
		message: "Invalid phone number",
	}),
})
const otpSchema = z.object({
	otp: z.string(),
})
const registerSchema = z.object({
	name: z.string(),
	email: z.string().email(),
	location: z.string(),
})

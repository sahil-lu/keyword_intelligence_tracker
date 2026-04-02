"use client"

import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Label } from "@/ui/label"
import { useFirebaseAuth } from "@/providers/firebase-auth-provider"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function LoginPage() {
	const { user, loading, configError, signIn, signUp } = useFirebaseAuth()
	const router = useRouter()
	const [mode, setMode] = useState("signin")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [busy, setBusy] = useState(false)

	useEffect(() => {
		if (!loading && user) {
			router.replace("/")
		}
	}, [loading, user, router])

	const onSubmit = async e => {
		e.preventDefault()
		if (!email.trim() || !password) {
			toast.error("Enter email and password.")
			return
		}

		setBusy(true)
		try {
			if (mode === "signin") {
				await signIn(email.trim(), password)
			} else {
				await signUp(email.trim(), password)
			}
			toast.success(mode === "signin" ? "Signed in." : "Account created.")
			router.replace("/")
		} catch (err) {
			console.error(err)
			toast.error(err?.message || "Authentication failed.")
		} finally {
			setBusy(false)
		}
	}

	if (configError) {
		return (
			<div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
				<p className="text-oklch(0.45 0 0) dark:text-oklch(0.75 0 0) max-w-md text-center text-sm">
					Firebase client env is missing. Add{" "}
					<code className="bg-oklch(0.96 0 0) dark:bg-oklch(0.25 0 0) rounded px-1">
						NEXT_PUBLIC_FIREBASE_*
					</code>{" "}
					to{" "}
					<code className="bg-oklch(0.96 0 0) dark:bg-oklch(0.25 0 0) rounded px-1">
						.env.local
					</code>{" "}
					(see repo{" "}
					<code className="bg-oklch(0.96 0 0) dark:bg-oklch(0.25 0 0) rounded px-1">
						.env.example
					</code>
					).
				</p>
			</div>
		)
	}

	if (loading || user) {
		return (
			<div className="flex min-h-dvh items-center justify-center">
				<p className="text-oklch(0.45 0 0) dark:text-oklch(0.75 0 0) text-sm">
					Loading…
				</p>
			</div>
		)
	}

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
			<div className="w-full max-w-sm space-y-6">
				<div className="space-y-1 text-center">
					<h1 className="text-2xl font-semibold tracking-tight">
						Keyword Intelligence Radar
					</h1>
					<p className="text-oklch(0.45 0 0) dark:text-oklch(0.75 0 0) text-sm">
						{mode === "signin"
							? "Sign in to open the monitoring dashboard."
							: "Create an account to get started."}
					</p>
				</div>

				<form
					onSubmit={onSubmit}
					className="space-y-4"
				>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							value={email}
							onChange={e => setEmail(e.target.value)}
							placeholder="you@company.com"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							autoComplete={
								mode === "signin"
									? "current-password"
									: "new-password"
							}
							value={password}
							onChange={e => setPassword(e.target.value)}
							placeholder="••••••••"
							required
							minLength={6}
						/>
					</div>
					<Button
						type="submit"
						className="w-full"
						disabled={busy}
					>
						{busy
							? "Please wait…"
							: mode === "signin"
								? "Sign in"
								: "Create account"}
					</Button>
				</form>

				<p className="text-oklch(0.45 0 0) dark:text-oklch(0.75 0 0) text-center text-sm">
					{mode === "signin" ? (
						<>
							No account?{" "}
							<button
								type="button"
								className="font-medium underline-offset-2 hover:underline"
								onClick={() => setMode("signup")}
							>
								Sign up
							</button>
						</>
					) : (
						<>
							Already have an account?{" "}
							<button
								type="button"
								className="font-medium underline-offset-2 hover:underline"
								onClick={() => setMode("signin")}
							>
								Sign in
							</button>
						</>
					)}
				</p>

				<p className="text-oklch(0.55 0 0) dark:text-oklch(0.6 0 0) text-center text-xs">
					Enable Email/Password in Firebase Console → Authentication →
					Sign-in method.
				</p>
			</div>

			<Link
				href="/"
				className="text-oklch(0.55 0 0) dark:text-oklch(0.6 0 0) text-xs underline-offset-2 hover:underline"
			>
				Back to app
			</Link>
		</div>
	)
}

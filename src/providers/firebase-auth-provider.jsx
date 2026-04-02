"use client"

import { getFirebaseAuth } from "@/lib/firebase-client"
import {
	createUserWithEmailAndPassword,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut as firebaseSignOut,
} from "firebase/auth"
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react"

const FirebaseAuthContext = createContext(null)

export function FirebaseAuthProvider({ children }) {
	const [user, setUser] = useState(null)
	const [loading, setLoading] = useState(true)
	const [configError, setConfigError] = useState(false)

	useEffect(() => {
		const auth = getFirebaseAuth()
		if (!auth) {
			queueMicrotask(() => {
				setConfigError(true)
				setLoading(false)
			})
			return
		}

		const unsub = onAuthStateChanged(auth, u => {
			setUser(u)
			setLoading(false)
		})

		return () => unsub()
	}, [])

	const signIn = useCallback(async (email, password) => {
		const auth = getFirebaseAuth()
		if (!auth) throw new Error("Firebase auth is not configured.")
		await signInWithEmailAndPassword(auth, email, password)
	}, [])

	const signUp = useCallback(async (email, password) => {
		const auth = getFirebaseAuth()
		if (!auth) throw new Error("Firebase auth is not configured.")
		await createUserWithEmailAndPassword(auth, email, password)
	}, [])

	const signOut = useCallback(async () => {
		const auth = getFirebaseAuth()
		if (auth) await firebaseSignOut(auth)
	}, [])

	const value = useMemo(
		() => ({
			user,
			loading,
			configError,
			signIn,
			signUp,
			signOut,
		}),
		[user, loading, configError, signIn, signUp, signOut]
	)

	return (
		<FirebaseAuthContext.Provider value={value}>
			{children}
		</FirebaseAuthContext.Provider>
	)
}

export function useFirebaseAuth() {
	const ctx = useContext(FirebaseAuthContext)
	if (!ctx) {
		throw new Error(
			"useFirebaseAuth must be used within FirebaseAuthProvider"
		)
	}
	return ctx
}

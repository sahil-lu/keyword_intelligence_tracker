import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

function getClientConfig() {
	return {
		apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
		authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
		projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
		storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
		messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
		appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
		measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
	}
}

/**
 * Returns the default Firebase app on the client, or null if env is missing.
 */
export function getFirebaseApp() {
	if (typeof window === "undefined") return null

	const config = getClientConfig()
	if (!config.apiKey || !config.projectId) {
		return null
	}

	if (!getApps().length) {
		return initializeApp(config)
	}

	return getApp()
}

export function getFirebaseAuth() {
	const app = getFirebaseApp()
	if (!app) return null
	return getAuth(app)
}

/**
 * Firebase Admin: Firestore for projects/reports; Storage initialized for future use.
 */
import { readFileSync } from "node:fs"
import admin from "firebase-admin"

let initialized = false

function initFirebase() {
	if (initialized) return

	if (admin.apps.length > 0) {
		initialized = true
		return
	}

	const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
	const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

	if (json) {
		const parsed = JSON.parse(json)
		admin.initializeApp({
			credential: admin.credential.cert(parsed),
			storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
		})
	} else if (credPath) {
		const parsed = JSON.parse(readFileSync(credPath, "utf8"))
		admin.initializeApp({
			credential: admin.credential.cert(parsed),
			storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
		})
	} else {
		throw new Error(
			"Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS."
		)
	}

	initialized = true
}

export function getFirestore() {
	initFirebase()
	return admin.firestore()
}

/** Optional: use when you need to upload raw HTML or assets. */
export function getStorageBucket() {
	initFirebase()
	const bucket = process.env.FIREBASE_STORAGE_BUCKET
	if (!bucket) return null
	return admin.storage().bucket(bucket)
}

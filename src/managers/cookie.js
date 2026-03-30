import { logout } from "@/actions/auth"
import { addMinutes, fromUnixTime, isBefore } from "date-fns"
import Cookies from "js-cookie"
import { jwtDecode } from "jwt-decode"

// Default wildcard configuration for cookie handling
const DEFAULT_WILDCARD_CONFIG = {
	basicAccess: true,
	access: false,
	refresh: false,
}

class CookieManager {
	/**
	 * @typedef {Object} TokenUpdateConditions
	 * @property {boolean} fresh - Indicates if the token is newly set.
	 * @property {boolean} updated - Indicates if the token value changed.
	 * @property {boolean} reset - Indicates if the token was reset (removed).
	 */

	/**
	 * @typedef {Object} CookieOptions
	 * @property {string} path - Path for the cookie.
	 * @property {number|Date} [expires] - Expiry time or date.
	 * @property {string} [domain] - Domain where the cookie is accessible.
	 */

	/**
	 * @typedef {Object} Tokens
	 * @property {string|null} basicAccessToken - Token for basic access.
	 * @property {string|null} accessToken - Token for privileged access.
	 * @property {string|null} refreshToken - Token for refreshing access.
	 */

	/**
	 * @typedef {Object} WildCardConfig
	 * @property {boolean} [basicAccess] - Wildcard support for basic access token.
	 * @property {boolean} [access] - Wildcard support for access token.
	 * @property {boolean} [refresh] - Wildcard support for refresh token.
	 */

	/**
	 * Initializes the CookieManager instance.
	 * @param {boolean|WildCardConfig} [useWildCard=DEFAULT_WILDCARD_CONFIG] - Wildcard configuration for cookie handling.
	 */
	constructor(useWildCard = DEFAULT_WILDCARD_CONFIG) {
		if (!process.env.NEXT_PUBLIC_COOKIE_KEY) {
			console.error(
				"NEXT_PUBLIC_COOKIE_KEY is not set in the environment variables."
			)
			return
		}

		const isLocalHost =
			typeof window !== "undefined"
				? window.location.hostname.includes("localhost")
				: true

		const COOKIE_KEY =
			process.env.NEXT_PUBLIC_COOKIE_KEY ||
			(isLocalHost
				? "lisa"
				: this.cookieKeyForDomain(window.location.hostname))

		const domain = isLocalHost ? "localhost" : window.location.hostname
		const wildCardDomain = !isLocalHost
			? `.${domain.split(".").slice(-2).join(".")}`
			: undefined

		this.wildCardConfig =
			typeof useWildCard === "boolean"
				? {
					basicAccess: useWildCard,
					access: useWildCard,
					refresh: useWildCard,
				}
				: { ...DEFAULT_WILDCARD_CONFIG, ...useWildCard }

		this.cookieKeys = {
			basicAccess: `${COOKIE_KEY}_basic_access`,
			access: `${COOKIE_KEY}_access`,
			refresh: `${COOKIE_KEY}_refresh`,
		}

		this.cookieOptions = { path: "/", expires: 1 }
		this.wildCardCookieOptions = {
			...this.cookieOptions,
			domain: wildCardDomain,
		}

		this.observers = {}
		this.channel =
			typeof BroadcastChannel !== "undefined"
				? new BroadcastChannel("cookieUpdates")
				: null

		if (this.channel)
			this.channel.onmessage = event => {
				const { cookieKey, value, conditions } = event.data
				this.notify(cookieKey, value, conditions, true)
			}
	}

	/**
	 * Determines the appropriate cookie options for a token type.
	 * @param {"basicAccess"|"access"|"refresh"} tokenType - The type of token.
	 * @returns {CookieOptions} The cookie options for the token type.
	 * @private
	 */
	getCookieOptions(tokenType) {
		return this.wildCardConfig[tokenType]
			? this.wildCardCookieOptions
			: this.cookieOptions
	}

	/**
	 * Notifies all observers of a token update.
	 * @param {string} cookieKey - The key of the cookie being updated.
	 * @param {string|null} value - The updated value of the cookie.
	 * @param {Partial<TokenUpdateConditions>} conditions - Conditions of the update.
	 * @param {boolean} [isBroadcasted=false] - Whether the update was broadcasted from another tab.
	 * @private
	 */
	notify(cookieKey, value, conditions, isBroadcasted = false) {
		this.observers[cookieKey]?.forEach(observer =>
			observer({ value, conditions, isBroadcasted })
		)

		if (!isBroadcasted && this.channel) {
			this.channel.postMessage({
				cookieKey,
				value,
				conditions,
				isBroadcasted,
			})
		}
	}

	/**
	 * Subscribes to updates for a specific token type.
	 * @param {"basicAccess"|"access"|"refresh"} key - The token type.
	 * @param {Function} callback - The callback to invoke on updates.
	 * @returns {Function} A function to unsubscribe from updates.
	 */
	subscribe(key, callback) {
		const cookieKey = this.cookieKeys[key]
		this.observers[cookieKey] = this.observers[cookieKey] || []
		this.observers[cookieKey].push(callback)

		return () => {
			this.observers[cookieKey] = this.observers[cookieKey]?.filter(
				observer => observer !== callback
			)
		}
	}

	/**
	 * Updates a specific token value and notifies observers.
	 * @param {"basicAccess"|"access"|"refresh"} tokenType - The token type.
	 * @param {string|null} token - The new token value.
	 * @param {string} key - The key of the cookie.
	 */
	updateToken(tokenType, token, key) {
		if (token) {
			const expires = this.getJwtExpiration(token)
			const prevToken = Cookies.get(key) || null

			Cookies.set(key, token, {
				...this.getCookieOptions(tokenType),
				expires,
			})

			if (prevToken !== token) {
				this.notify(key, token, {
					fresh: prevToken === null,
					updated: prevToken !== null,
					reset: false,
				})
			}
		} else {
			Cookies.remove(key, this.getCookieOptions(tokenType))
			this.notify(key, null, {
				fresh: false,
				updated: false,
				reset: true,
			})
		}
	}

	/**
	 * Decodes a JWT token to determine its expiration time.
	 * @param {string} token - The JWT token.
	 * @returns {Date} The expiration date of the token.
	 * @private
	 */
	getJwtExpiration(token) {
		const decoded = jwtDecode(token)
		return fromUnixTime(decoded.exp)
	}

	/**
	 * Checks if a token is expiring soon.
	 * @param {string} token - The JWT token.
	 * @param {number} [minutes=30] - The threshold in minutes.
	 * @returns {boolean} Whether the token is expiring soon.
	 */
	isTokenExpiringSoon(token, minutes = 30) {
		try {
			const { exp } = jwtDecode(token)
			if (!exp) return false

			const isExpiringSoon = isBefore(
				new Date(exp * 1000),
				addMinutes(new Date(), minutes)
			)

			if (isExpiringSoon) logout()
			return isExpiringSoon
		} catch (error) {
			console.error("Invalid token:", error)
			logout()
			return true
		}
	}

	/**
	 * Retrieves a specific token by type.
	 * @param {"basicAccess"|"access"|"refresh"} tokenType - The token type.
	 * @returns {string|null} The token value or null if not set.
	 */
	getToken(tokenType) {
		return Cookies.get(this.cookieKeys[tokenType]) || null
	}

	/**
	 * Retrieves all managed tokens.
	 * @returns {Tokens} All tokens managed by the CookieManager.
	 */
	getTokens() {
		return {
			basicAccessToken: this.getToken("basicAccess"),
			accessToken: this.getToken("access"),
			refreshToken: this.getToken("refresh"),
		}
	}

	/**
	 * Sets multiple tokens at once.
	 * @param {Partial<Tokens>} tokens - Tokens to be set.
	 */
	setTokens(tokens) {
		this.updateToken(
			"basicAccess",
			tokens.basicAccessToken ?? null,
			this.cookieKeys.basicAccess
		)
		this.updateToken(
			"access",
			tokens.accessToken ?? null,
			this.cookieKeys.access
		)
		this.updateToken(
			"refresh",
			tokens.refreshToken ?? null,
			this.cookieKeys.refresh
		)
	}

	/**
	 * Removes all tokens.
	 */
	removeTokens() {
		Object.keys(this.cookieKeys).forEach(key =>
			this.updateToken(
				key,
				null,
				this.cookieKeys[key]
			)
		)
	}

	/**
	 * Generates a cookie key for a specific domain.
	 * @param {string} hostname - The hostname for the domain.
	 * @returns {string} The cookie key.
	 * @private
	 */
	cookieKeyForDomain(hostname) {
		const parts = hostname.split(".")
		return parts.length === 2 ? parts[0] : parts.slice(0, -1).join("_")
	}
}

export default CookieManager

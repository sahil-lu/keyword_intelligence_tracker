"use server";

// import * as Sentry from "@sentry/nextjs"
import { jwtDecode } from "jwt-decode";
import { cookies, headers } from "next/headers";
import { bgRed, blue, bold, green, red, yellow } from "picocolors";

// Default options for API requests
const DEFAULT_OPTIONS = {
	headers: {},
	noContentType: false,
	responseType: "json",
	skipResponseHandling: false,
	customAuthorization: false,
	method: "GET",
};

/**
 * Logs the status of an API request with color-coded output
 *
 * @param {undefined | null | number} status - The status code of the response.
 * @param {string} method - The HTTP method used for the request.
 * @param {string} url - The URL of the request.
 * @returns {void} Logs the request status with color-coded status.
 */
const logRequestStatus = ({ status, method, url }) => {
	// Color code based on status code
	const statusColor = status
		? status >= 200 && status < 300
			? green(status)
			: status >= 400 && status < 500
				? yellow(status)
				: red(status)
		: red("-");

	// Log the request method and URL with color-coded status
	console.log(`${statusColor} - ${bold(blue(method))}: ${url}`);
};

/**
 * Retrieves a token from cookies based on the token type.
 *
 * @param {string} tokenType - The type of token to retrieve (e.g., "access", "refresh").
 * @returns {Promise<string|null>} The token value or null if not found.
 */
const getToken = async (tokenType) => {
	const cookieStore = await cookies();

	return (
		cookieStore.get(`${process.env.NEXT_PUBLIC_COOKIE_KEY}_${tokenType}`)
			?.value || null
	);
};

/**
 * Custom fetch function for making API requests with token handling.
 *
 * @param {string} baseUrl - The base URL for the API.
 * @param {string} endpoint - The endpoint to fetch from.
 * @param {Object} options - Fetch options including method, headers, and body.
 * @param {string} [tokenType="access"] - The type of token to use for authorization.
 * @returns {Promise<Object>} The response object containing error status and response data.
 */
export const customFetch = async (
	baseUrl,
	endpoint,
	options = DEFAULT_OPTIONS,
	tokenType = "access"
) => {
	let uid, token, errMsg, responseData;

	const fallbackToken = options?.fallbackToken;
	delete options.fallbackToken;

	const apiDetails = {
		method: options.method,
		url: `${baseUrl}${endpoint}`,
		status: null,
		statusText: null,
		headers: null,
		body: null,
		responseType: options.responseType,
		skipResponseHandling: options.skipResponseHandling,
		noContentType: options.noContentType,
		errMsg: null
	};

	/**
	 * Captures error details for logging and monitoring.
	 *
	 * @param {string} error - The error message.
	 * @param {string} from - The context from which the error originated.
	 */
	const captureError = async (error, from) => {
		const errorDetails = {
			error,
			from,
			errMsg,
			tokenType,
			...apiDetails,
		};
		console.log(`${bgRed("ERROR")}:`, errorDetails);

		// Sentry.withScope(scope => {
		// 	const errorInstance = error instanceof Error ? error : new Error(error)
		// 	scope.setContext("API Error Details", errorDetails)

		// 	if (uid) scope.setUser({ id: uid })

		// 	Sentry.captureException(errorInstance)
		// })

		if (uid) {
			// posthog.capture({
			// 	distinctId: uid,
			// 	event: "error",
			// 	properties: {
			// 		error,
			// 		from,
			// 		errMsg,
			// 		tokenType,
			// 		token,
			// 		...apiDetails,
			// 	},
			// });
		}
	};

	try {
		// If token type is 'access', decode the token and extract user ID
		if (tokenType === "access") {
			const accessToken = fallbackToken ?? (await getToken("access"));
			if (accessToken) {
				const decodedAccessToken = jwtDecode(accessToken);
				uid = decodedAccessToken.uid; // Store user ID for error logging
			}
		}

		// Add default Content-Type header if not disabled
		if (!options.noContentType) {
			if (!options.headers) options.headers = {};
			options.headers["Content-Type"] ??= "application/json";
		} else delete options.headers?.["Content-Type"]; // Remove Content-Type if disabled

		// Get the token for authorization
		if (tokenType !== null && !options.customAuthorization) {
			token = fallbackToken || (await getToken(tokenType));

			// If no token found, capture error and return failure response
			if (!token) {
				errMsg = `No token found for request to ${baseUrl}${endpoint}`;
				apiDetails.errMsg = errMsg;
				captureError("No Token", "attachToken", apiDetails);
				return {
					error: true,
					message: errMsg,
					data: null,
				};
			}

			// Set Authorization header with the token
			if (!options.headers) options.headers = {};
			options.headers["Authorization"] = `Bearer ${token}`;
		}

		// Stringify the body if it's provided and content type is set
		if (options.body && !options.noContentType)
			options.body = JSON.stringify(options.body);

		apiDetails.headers = options.headers;
		apiDetails.body = options.body;

		// Make the API request with the specified options
		const res = await fetch(`${baseUrl}${endpoint} `, options);

		// Capture response status and details
		apiDetails.status = res.status;
		apiDetails.statusText = res.statusText ?? "OK";

		logRequestStatus(apiDetails); // Log request status

		// If skipping response handling, return raw response
		if (options.skipResponseHandling)
			return { error: false, message: null, data: res };

		// Parse the response data based on the expected response type
		try {
			responseData = await res[options.responseType]();
		} catch (err) {
			errMsg = `Error reading response as ${options.responseType}: ${err.message}`;
			apiDetails.errMsg = errMsg;
			captureError(
				"Response Parsing Error",
				"responseParsing",
				apiDetails
			);
			return {
				error: true,
				message: errMsg,
				data: null,
			};
		}

		// Handle unsuccessful responses
		if (!res.ok) {
			if (res.status !== 401) {
				errMsg = responseData.message || "Something went wrong";
				apiDetails.errMsg = errMsg;
				captureError("API Failed", "apiError", apiDetails);
				return {
					error: true,
					message: errMsg,
					data: null,
				};
			}

			// Token refresh flow for 401 Unauthorized error
			const newAccessToken = await refreshToken();
			if (!newAccessToken) {
				errMsg = "Token refresh failed";
				apiDetails.errMsg = errMsg;
				handleTokenRefreshFailure(); // Clear all tokens from cookies
				captureError(
					"Token refresh failed",
					"refreshToken",
					apiDetails
				);
				return {
					error: true,
					message: errMsg,
					data: null,
				};
			}

			// Retry the request with the new access token
			if (!options.headers) options.headers = {};
			options.headers.Authorization = `Bearer ${newAccessToken}`;
			const retryRes = await fetch(`${baseUrl}${endpoint}`, options);

			// Parse the retry response
			let retryResData;
			try {
				retryResData = await retryRes[options.responseType]();
			} catch (err) {
				errMsg = `Error reading response after retrying with new token as ${options.responseType}: ${err.message}`;
				captureError(
					"Response Parsing Error after retrying with new token",
					"responseParsing",
					apiDetails
				);
				return {
					error: true,
					message: errMsg,
					data: null,
				};
			}

			// Return the response if retry is successful
			if (retryRes.ok) {
				return {
					error: false,
					message: retryResData.message ?? "",
					data: retryResData.results ?? retryResData,
				};
			} else {
				apiDetails.errMsg = "Failed after retrying with new token";
				captureError(
					"Failed after retrying with new token",
					"refreshToken",
					apiDetails
				);
				return {
					error: true,
					message: "Failed after retrying with new token",
					data: null,
				};
			}
		}

		// Return successful response data
		return {
			error: false,
			message: responseData.message ?? "",
			data:
				responseData.results.data ??
				responseData.results ??
				responseData,
		};
	} catch (err) {
		errMsg = `Error occurred while fetching ${baseUrl}${endpoint}: ${err.message}`;
		apiDetails.errMsg = errMsg;
		captureError("Something went wrong", "apiHandler", apiDetails);
		return { error: true, message: errMsg, data: null };
	}
};

/**
 * Refreshes the access token using the refresh token
 *
 * @returns {Promise<string|null>} The new access token or null if refresh failed.
 */
const refreshToken = async () => {
	const refreshToken = await getToken("refresh");
	if (!refreshToken) return null;

	const cookieStore = await cookies();
	const headersList = await headers();

	const host = headersList.get("host");
	const proto = headersList.get("x-forwarded-proto") || "http";
	const hostname =
		host && !host.startsWith("localhost")
			? `${proto}://${host}`
			: process.env.MY_LOCAL_API_URL;

	// Make a request to refresh the token
	const resp = await fetch(process.env.ACCESS_PATH, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			refresh: refreshToken,
			subDomain: hostname,
		}),
	});

	// If response is not successful, return null
	if (resp.status !== 200) return null;

	// Extract and return the new access token
	const newAccessToken = await resp.json().then((data) => data.jwt);
	cookieStore.set("token", newAccessToken);
	return newAccessToken;
};

/**
 * Handles token refresh failures by deleting all tokens from cookies.
 */
const handleTokenRefreshFailure = async () => {
	const cookieKey = process.env.NEXT_PUBLIC_COOKIE_KEY;
	const cookieStore = await cookies();

	// Delete all relevant tokens from cookies
	["basic_access", "access", "refresh"].forEach((tokenType) =>
		cookieStore.delete(`${cookieKey}_${tokenType}`)
	);
};

export const fetchClientWithToken = async (endpoint, options) =>
	customFetch(process.env.CLIENT_API_URL, endpoint, options, "access");

export const fetchClientWithoutToken = async (endpoint, options) =>
	customFetch(process.env.CLIENT_API_URL, endpoint, options, null);

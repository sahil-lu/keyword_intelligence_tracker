const BASE =
	process.env.NEXT_PUBLIC_RADAR_API_URL?.replace(/\/$/, "") ||
	"http://localhost:4000"

async function request(path, options = {}) {
	let res
	try {
		res = await fetch(`${BASE}${path}`, {
			...options,
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
		})
	} catch (err) {
		throw new Error(
			`Cannot reach the API at ${BASE}. Is the backend running? ${err?.message || ""}`
		)
	}
	const data = await res.json().catch(() => ({}))
	if (!res.ok) {
		throw new Error(data.error || `Request failed (${res.status})`)
	}
	return data
}

export const radarApi = {
	getProjects: () => request("/projects"),
	getProject: id => request(`/projects/${id}`),
	createProject: data =>
		request("/projects", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	runScan: id => request(`/projects/${id}/run`, { method: "POST" }),

	getReport: id => request(`/projects/${id}/report`),

	getSignals: (id, filters = {}) => {
		const params = new URLSearchParams()
		if (filters.priority) params.set("priority", filters.priority)
		if (filters.agent) params.set("agent", filters.agent)
		if (filters.change_type) params.set("change_type", filters.change_type)
		const qs = params.toString()
		return request(`/projects/${id}/signals${qs ? `?${qs}` : ""}`)
	},

	getRuns: id => request(`/projects/${id}/runs`),
	getDocuments: id => request(`/projects/${id}/documents`),
}

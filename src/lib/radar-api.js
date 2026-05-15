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
	updateProject: (id, data) =>
		request(`/projects/${id}`, {
			method: "PUT",
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
	getModelReports: (id, runId) =>
		request(`/projects/${id}/runs/${runId}/model-reports`),
	getDocuments: id => request(`/projects/${id}/documents`),
	getTrends: (id, limit = 20) =>
		request(`/projects/${id}/trends?limit=${limit}`),

	updateSources: (id, sources) =>
		request(`/projects/${id}/sources`, {
			method: "PUT",
			body: JSON.stringify({ sources }),
		}),

	updateCompetitors: (id, data) =>
		request(`/projects/${id}/competitors`, {
			method: "PUT",
			body: JSON.stringify(data),
		}),

	updateEmailSettings: (id, data) =>
		request(`/projects/${id}/email-settings`, {
			method: "PUT",
			body: JSON.stringify(data),
		}),

	getUploads: id => request(`/projects/${id}/uploads`),

	uploadDocument: async (id, file) => {
		const form = new FormData()
		form.append("file", file)
		const res = await fetch(`${BASE}/projects/${id}/uploads`, {
			method: "POST",
			body: form,
		})
		const data = await res.json().catch(() => ({}))
		if (!res.ok)
			throw new Error(data.error || `Upload failed (${res.status})`)
		return data
	},

	deleteUpload: (id, uploadId) =>
		request(`/projects/${id}/uploads/${uploadId}`, { method: "DELETE" }),
}

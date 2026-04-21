import dotenv from "dotenv"
import cors from "cors"
import express from "express"
import projectsRouter from "./routes/projects.js"
import reportsRouter from "./routes/reports.js"
import signalsRouter from "./routes/signals.js"
import runsRouter from "./routes/runs.js"
import documentsRouter from "./routes/documents.js"
import { startScheduler } from "./services/scheduler.js"
import { fileURLToPath } from "node:url"
import path from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, "../.env") })

const app = express()
const port = Number(process.env.PORT || 4000)

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000"
app.use(
	cors({
		origin: corsOrigin,
		credentials: true,
	})
)
app.use(express.json({ limit: "1mb" }))

app.get("/health", (_req, res) => {
	res.json({ ok: true, service: "keyword-intelligence-radar-api" })
})

app.use("/projects", reportsRouter)
app.use("/projects", signalsRouter)
app.use("/projects", runsRouter)
app.use("/projects", documentsRouter)
app.use("/projects", projectsRouter)

function boot() {
	if (process.env.ENABLE_SCHEDULER === "true") {
		startScheduler()
	}

	app.listen(port, () => {
		console.log(`Keyword Intelligence Radar API listening on :${port}`)
	})
}

boot()

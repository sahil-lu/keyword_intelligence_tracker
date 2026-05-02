import nodemailer from "nodemailer"

function log(stage, data) {
	const ts = new Date().toISOString()
	console.log(JSON.stringify({ ts, stage, ...data }))
}

function getTransporter() {
	const provider = (process.env.EMAIL_PROVIDER || "smtp").toLowerCase()

	if (provider === "resend") {
		return nodemailer.createTransport({
			host: "smtp.resend.com",
			port: 465,
			secure: true,
			auth: {
				user: "resend",
				pass: process.env.EMAIL_API_KEY,
			},
		})
	}

	return nodemailer.createTransport({
		host: process.env.SMTP_HOST || "smtp.gmail.com",
		port: Number(process.env.SMTP_PORT) || 587,
		secure: false,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.EMAIL_API_KEY,
		},
	})
}

function buildHtml(project, report) {
	const r = report
	const stats = r.stats || {}
	const topActions = (r.top_actions || []).slice(0, 3)
	const topSignals = (r.top_findings || []).slice(0, 3)
	const dashboardUrl = process.env.DASHBOARD_URL || "http://localhost:3000"

	const actionRows = topActions
		.map(
			(a, i) =>
				`<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">${i + 1}.</td><td style="padding:8px;border-bottom:1px solid #eee;">${escHtml(a.action)}</td><td style="padding:8px;border-bottom:1px solid #eee;color:#b45309;">${escHtml(a.why || "")}</td></tr>`
		)
		.join("")

	const signalRows = topSignals
		.map(
			s =>
				`<tr><td style="padding:8px;border-bottom:1px solid #eee;">${escHtml(s.title)}</td><td style="padding:8px;border-bottom:1px solid #eee;"><span style="background:${s.priority === "HIGH" ? "#fee2e2" : "#fef9c3"};color:${s.priority === "HIGH" ? "#991b1b" : "#854d0e"};padding:2px 8px;border-radius:4px;font-size:11px;">${s.priority}</span></td><td style="padding:8px;border-bottom:1px solid #eee;color:#059669;">${escHtml(s.recommended_action || "")}</td></tr>`
		)
		.join("")

	return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b;max-width:640px;margin:0 auto;padding:20px;">
<div style="border-bottom:2px solid #18181b;padding-bottom:12px;margin-bottom:20px;">
  <h1 style="font-size:18px;margin:0;">ITM Intelligence Report</h1>
  <p style="color:#71717a;font-size:13px;margin:4px 0 0;">${escHtml(project.name || "")} &middot; ${escHtml(project.keyword || "")}</p>
</div>

<div style="background:#f4f4f5;border-radius:8px;padding:16px;margin-bottom:20px;">
  <p style="font-size:14px;margin:0;line-height:1.6;">${escHtml(r.executive_summary || "No summary available.")}</p>
</div>

<div style="display:flex;gap:12px;margin-bottom:20px;">
  <div style="background:#fff;border:1px solid #e4e4e7;border-radius:8px;padding:12px;text-align:center;flex:1;">
    <div style="font-size:24px;font-weight:700;">${stats.total ?? 0}</div>
    <div style="font-size:11px;color:#71717a;">Total Signals</div>
  </div>
  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;text-align:center;flex:1;">
    <div style="font-size:24px;font-weight:700;color:#dc2626;">${stats.high ?? 0}</div>
    <div style="font-size:11px;color:#71717a;">High Priority</div>
  </div>
  <div style="background:#fff;border:1px solid #e4e4e7;border-radius:8px;padding:12px;text-align:center;flex:1;">
    <div style="font-size:24px;font-weight:700;">${stats.new ?? 0}</div>
    <div style="font-size:11px;color:#71717a;">New</div>
  </div>
</div>

${
	topActions.length > 0
		? `
<h2 style="font-size:14px;margin:20px 0 8px;">Top Actions</h2>
<table style="width:100%;border-collapse:collapse;font-size:13px;">
<thead><tr style="background:#f4f4f5;"><th style="padding:8px;text-align:left;">#</th><th style="padding:8px;text-align:left;">Action</th><th style="padding:8px;text-align:left;">Why</th></tr></thead>
<tbody>${actionRows}</tbody>
</table>`
		: ""
}

${
	topSignals.length > 0
		? `
<h2 style="font-size:14px;margin:20px 0 8px;">Top Signals</h2>
<table style="width:100%;border-collapse:collapse;font-size:13px;">
<thead><tr style="background:#f4f4f5;"><th style="padding:8px;text-align:left;">Signal</th><th style="padding:8px;text-align:left;">Priority</th><th style="padding:8px;text-align:left;">Action</th></tr></thead>
<tbody>${signalRows}</tbody>
</table>`
		: ""
}

<div style="margin-top:24px;text-align:center;">
  <a href="${dashboardUrl}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:500;">Open Dashboard</a>
</div>

<p style="margin-top:24px;font-size:11px;color:#a1a1aa;text-align:center;">ITM Decision Intelligence Engine</p>
</body>
</html>`
}

function escHtml(str) {
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
}

export async function sendEmailReport(project, report, recipients) {
	if (!recipients?.length) {
		log("email:skip", { projectId: project.id, reason: "no recipients" })
		return
	}

	const apiKey = process.env.EMAIL_API_KEY
	if (!apiKey) {
		log("email:skip", {
			projectId: project.id,
			reason: "EMAIL_API_KEY not set",
		})
		return
	}

	const from = process.env.EMAIL_FROM || "noreply@itm-intel.com"

	try {
		const transporter = getTransporter()
		const html = buildHtml(project, report)
		const stats = report.stats || {}
		const subject = `[ITM Intel] ${stats.high || 0} high-priority signals — ${project.name || project.keyword}`

		await transporter.sendMail({
			from,
			to: recipients.join(", "),
			subject,
			html,
		})

		log("email:sent", {
			projectId: project.id,
			recipients: recipients.length,
			subject,
		})
	} catch (err) {
		log("email:error", {
			projectId: project.id,
			error: err.message,
		})
	}
}

/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		viewTransition: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "frontend-assets.supabase.com",
			},
		],
	},
}

export default nextConfig

import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";

const GA_ID = process.env.GOOGLE_ANALYTICS_ID;
const CLARITY_ID = process.env.CLARITY_ID;

const Analytics = () => {
	return (
		<>
			{GA_ID && <GoogleAnalytics gaId={GA_ID} />}
			{CLARITY_ID && (
				<Script id="microsoft-clarity" strategy="afterInteractive">
					{`(function(c,l,a,r,i,t,y){
	c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
	t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
	y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${CLARITY_ID}");`}
				</Script>
			)}
		</>
	);
};

export default Analytics;

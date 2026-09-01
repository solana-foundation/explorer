'use client';

import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';

import { useAnalyticsConsent } from '@/app/features/cookie';

import { WebVitalsReporter } from './WebVitalsReporter';

// At full rate Explorer traffic would run far past the included Speed Insights
// allowance; 10% still leaves ample volume for per-route percentiles.
const SPEED_INSIGHTS_SAMPLE_RATE = 0.1;

export default function Analytics() {
    const { isConsentGiven } = useAnalyticsConsent();

    return (
        <>
            {/* Ungated: Speed Insights writes nothing to the device, so the cookie
                banner's scope does not reach it. Everything below feeds gtag. */}
            <SpeedInsights sampleRate={SPEED_INSIGHTS_SAMPLE_RATE} />
            {isConsentGiven && (
                <>
                    <WebVitalsReporter />
                    <GoogleTags />
                </>
            )}
        </>
    );
}

function GoogleTags() {
    const safeAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.replace("'", "\\'");
    const safeTagId = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID?.replace("'", "\\'");

    if (!safeAnalyticsId && !safeTagId) {
        return null;
    }

    if (safeTagId) {
        return (
            <>
                <Script id="google-tag-initialization">
                    {`
                    (function(w,d,s,l,i){w[l] = w[l] || [];w[l].push({
                            'gtm.start': new Date().getTime(),
                            event: 'gtm.js'
                        });
                        var f=d.getElementsByTagName(s)[0],
                            j=d.createElement(s),
                            dl=l!='dataLayer'?'&l='+l:'';
                            j.async=true;
                            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                    })
                    (window,document,'script','dataLayer','${safeTagId}');
                `}
                </Script>
                <noscript>
                    <iframe
                        src={`https://www.googletagmanager.com/ns.html?id=${safeTagId}`}
                        height="0"
                        width="0"
                        style={{ display: 'none', visibility: 'hidden' }}
                    ></iframe>
                </noscript>
            </>
        );
    }

    // Fallback to Google Analytics if no Tag ID is provided
    return (
        <>
            {/* Global site tag (gtag.js) - Google Analytics  */}
            <Script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${safeAnalyticsId}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics-initialization" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${safeAnalyticsId}');
                `}
            </Script>
        </>
    );
}

'use client';

import { COOKIE_CONSENT_KEY } from '@components/common/CookieConsent';
import { localStorageIsAvailable } from '@utils/local-storage';
import Script from 'next/script';
import { useEffect, useState } from 'react';

export default function Analytics() {
    const [consent, setConsent] = useState(null);
    const safeAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.replace("'", "\\'");
    const safeTagId = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID?.replace("'", "\\'");

    const now = new Date().getTime();

    useEffect(() => {
        if (!localStorageIsAvailable()) return;

        const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);

        if (storedConsent) {
            try {
                const parsed = JSON.parse(storedConsent);

                if (parsed.timeToExpire && now > parsed.timeToExpire) {
                    localStorage.removeItem(COOKIE_CONSENT_KEY);
                    setConsent(null);
                } else {
                    setConsent(parsed.value);
                }
            } catch {
                localStorage.removeItem(COOKIE_CONSENT_KEY);
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (!safeAnalyticsId && !safeTagId) {
        return null;
    }

    if (consent !== true) {
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

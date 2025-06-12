'use client';
import Script from 'next/script';

export default function LogRocketComponent() {
    const logrocketId = process.env.NEXT_PUBLIC_LOGROCKET_ID?.replace("'", "\\'");
    if (!logrocketId) {
        return null;
    }

    return (
        <>
            <Script
                id="logrocket-load"
                src="https://cdn.lgrckt-in.com/LogRocket.min.js"
                crossorigin="anonymous"
                strategy="beforeInteractive"
            ></Script>
            <Script id="logrocket-init" strategy="afterInteractive">
                {`
                    window.LogRocket && window.LogRocket.init('${logrocketId}');
                `}
            </Script>
        </>
    );
}

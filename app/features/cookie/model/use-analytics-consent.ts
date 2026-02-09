'use client';

import { useEffect, useState } from 'react';

import { getCookie } from '../lib/cookie';
import { COOKIE_CONSENT_NAME } from '../ui/CookieConsent';

type ConsentState = string | null;

export function useAnalyticsConsent() {
    const [consent, setConsent] = useState<ConsentState>(null);

    useEffect(() => {
        const storedConsent = getCookie(COOKIE_CONSENT_NAME);
        setConsent(storedConsent);

        const handleConsentChange = (event: CustomEvent<string>) => {
            setConsent(event.detail);
        };
        window.addEventListener('cookie-consent-change', handleConsentChange as EventListener);
        return () => window.removeEventListener('cookie-consent-change', handleConsentChange as EventListener);
    }, []);

    const isConsentGiven = consent !== null && consent !== 'denied';

    return { consent, isConsentGiven };
}

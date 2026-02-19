'use client';

import { useEffect, useState } from 'react';

import { getCookie } from '@/app/utils/cookie';

import { COOKIE_CONSENT_CHANGE_EVENT, COOKIE_CONSENT_NAME, EConsentStatus } from '../ui/CookieConsent';

export function useAnalyticsConsent() {
    const [consent, setConsent] = useState<EConsentStatus | null>(null);

    useEffect(() => {
        const storedConsent = getCookie(COOKIE_CONSENT_NAME) as EConsentStatus | null;
        setConsent(storedConsent);

        const handleConsentChange = (event: CustomEvent<EConsentStatus>) => {
            setConsent(event.detail);
        };
        window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, handleConsentChange as EventListener);
        return () => window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, handleConsentChange as EventListener);
    }, []);

    const isConsentGiven = consent !== null && consent !== EConsentStatus.Denied;

    return { consent, isConsentGiven };
}

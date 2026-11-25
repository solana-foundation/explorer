'use client';

import { useEffect, useState } from 'react';

import { COOKIE_CONSENT_CHANGE_EVENT, EConsentStatus, getStoredConsent } from '../ui/CookieConsent';

export function useAnalyticsConsent() {
    const [consent, setConsent] = useState<EConsentStatus>();

    useEffect(() => {
        setConsent(getStoredConsent());

        const handleConsentChange = (event: CustomEvent<EConsentStatus>) => {
            setConsent(event.detail);
        };
        window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, handleConsentChange as EventListener);
        return () => window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, handleConsentChange as EventListener);
    }, []);

    const isConsentGiven = consent === EConsentStatus.Granted;

    return { consent, isConsentGiven };
}

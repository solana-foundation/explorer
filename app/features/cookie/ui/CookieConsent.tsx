'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/app/components/shared/utils';

import { getCookie, setCookie } from '../lib/cookie';

export const COOKIE_CONSENT_NAME = 'solana_cookie_consent';
export const COOKIE_COUNTRY_NAME = 'solana_country';
export const COOKIE_CONSENT_CHANGE_EVENT = 'cookie-consent-change';
const COOKIE_MAX_AGE = 15778476; // 6 months in seconds
const PRIVACY_POLICY_URL = 'https://solana.com/privacy-policy#collection-of-information';

export enum EConsentStatus {
    Granted = 'granted',
    Denied = 'denied',
}

export function CookieConsent() {
    const [consent, setConsent] = useState<EConsentStatus | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isEU, setIsEU] = useState<boolean | null>(null);

    const autoGrantConsent = () => {
        setCookie(COOKIE_CONSENT_NAME, EConsentStatus.Granted, COOKIE_MAX_AGE);
        setConsent(EConsentStatus.Granted);
        window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT, { detail: EConsentStatus.Granted }));
    };

    useEffect(() => {
        setIsMounted(true);
        const storedConsent = getCookie(COOKIE_CONSENT_NAME) as EConsentStatus | null;
        setConsent(storedConsent);

        if (storedConsent) return;

        fetch('/api/geo-location')
            .then(res => res.json())
            .then(data => {
                if (data.country) {
                    setCookie(COOKIE_COUNTRY_NAME, data.country, COOKIE_MAX_AGE);
                }
                setIsEU(data.isEU);
                if (!data.isEU) autoGrantConsent();
            })
            .catch(() => {
                setIsEU(false);
                autoGrantConsent();
            });
    }, []);

    const handleConsent = (value: EConsentStatus) => {
        setCookie(COOKIE_CONSENT_NAME, value, COOKIE_MAX_AGE);
        setConsent(value);
        window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT, { detail: value }));
    };

    if (!isMounted || consent !== null || isEU === null) {
        return null;
    }

    if (isEU) {
        return (
            <CookieCard>
                <p className="e-m-0 e-text-base e-leading-relaxed e-text-white">
                    This website uses cookies to offer you a better browsing experience. Find out more on{' '}
                    <PrivacyPolicyLink>how we use cookies</PrivacyPolicyLink>.
                </p>

                <div className="e-flex e-flex-row e-items-center e-justify-end e-gap-4">
                    <button
                        className="e-cursor-pointer e-border-none e-bg-transparent e-p-0 e-text-sm e-font-medium e-tracking-wider e-text-white e-transition-opacity hover:e-opacity-70"
                        onClick={() => handleConsent(EConsentStatus.Denied)}
                    >
                        OPT-OUT
                    </button>
                    <button
                        className="btn btn-white e-bg-transparent"
                        onClick={() => handleConsent(EConsentStatus.Granted)}
                    >
                        ACCEPT
                    </button>
                </div>
            </CookieCard>
        );
    }

    return null;
}

export function PrivacyPolicyLink({ children }: { children: React.ReactNode }) {
    return (
        <a
            href={PRIVACY_POLICY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="e-text-white e-underline e-transition-opacity hover:e-text-white hover:e-opacity-70"
        >
            {children}
        </a>
    );
}

export function CookieCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'e-fixed e-bottom-2.5 e-left-2.5 e-right-2.5 e-z-[1200] e-rounded-lg e-border e-border-slate-100 e-bg-black e-p-4 [border-style:solid] md:e-right-auto md:e-max-w-[400px]',
                className
            )}
        >
            {children}
        </div>
    );
}

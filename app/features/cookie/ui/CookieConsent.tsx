'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/app/components/shared/ui/button';
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
                <p className="m-0 text-base leading-relaxed text-white">
                    This website uses cookies to offer you a better browsing experience. Find out more on{' '}
                    <PrivacyPolicyLink>how we use cookies</PrivacyPolicyLink>.
                </p>

                <div className="flex flex-row items-center justify-end gap-4">
                    <button
                        className="cursor-pointer border-none bg-transparent p-0 text-sm font-medium tracking-wider text-white transition-opacity hover:opacity-70"
                        onClick={() => handleConsent(EConsentStatus.Denied)}
                    >
                        OPT-OUT
                    </button>
                    <Button
                        ui="dashkit"
                        variant="white"
                        className="bg-transparent"
                        onClick={() => handleConsent(EConsentStatus.Granted)}
                    >
                        ACCEPT
                    </Button>
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
            className="text-white underline transition-opacity hover:text-white hover:opacity-70"
        >
            {children}
        </a>
    );
}

export function CookieCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'fixed bottom-2.5 left-2.5 right-2.5 z-[1200] rounded-lg border border-slate-100 bg-black p-4 [border-style:solid] md:right-auto md:max-w-[400px]',
                className,
            )}
        >
            {children}
        </div>
    );
}

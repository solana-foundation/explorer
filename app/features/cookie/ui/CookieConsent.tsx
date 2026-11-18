'use client';

import { useEffect, useState } from 'react';
import { enums } from 'superstruct';

import { Button } from '@/app/components/shared/ui/button';
import { ExternalLink } from '@/app/components/shared/ui/external-link';
import { cn } from '@/app/components/shared/utils';

import { getStoredValue, setStoredValue } from '../lib/stored-value';

export const CONSENT_STORAGE_KEY = 'solana_cookie_consent';
export const COUNTRY_STORAGE_KEY = 'solana_country';
export const COOKIE_CONSENT_CHANGE_EVENT = 'cookie-consent-change';
const CONSENT_MAX_AGE_SECONDS = 15778476; // 6 months in seconds
const PRIVACY_POLICY_URL = 'https://solana.com/privacy-policy#collection-of-information';

export enum EConsentStatus {
    Granted = 'granted',
    Denied = 'denied',
}

export function CookieConsent() {
    const [consent, setConsent] = useState<EConsentStatus>();
    const [isMounted, setIsMounted] = useState(false);
    const [isEU, setIsEU] = useState<boolean | null>(null);

    const autoGrantConsent = () => {
        setStoredValue(CONSENT_STORAGE_KEY, EConsentStatus.Granted, CONSENT_MAX_AGE_SECONDS);
        setConsent(EConsentStatus.Granted);
        window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT, { detail: EConsentStatus.Granted }));
    };

    useEffect(() => {
        setIsMounted(true);
        const storedConsent = getStoredConsent();
        setConsent(storedConsent);

        if (storedConsent) return;

        fetch('/api/geo-location')
            .then(res => res.json())
            .then(data => {
                if (data.country) {
                    setStoredValue(COUNTRY_STORAGE_KEY, data.country, CONSENT_MAX_AGE_SECONDS);
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
        setStoredValue(CONSENT_STORAGE_KEY, value, CONSENT_MAX_AGE_SECONDS);
        setConsent(value);
        window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT, { detail: value }));
    };

    if (!isMounted || consent !== undefined || isEU === null) {
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

export function getStoredConsent(): EConsentStatus | undefined {
    return getStoredValue(CONSENT_STORAGE_KEY, enums(Object.values(EConsentStatus))) ?? readLegacyDenial();
}

const LEGACY_CONSENT_COOKIE = 'solana_cookie_consent';

function readLegacyDenial(): EConsentStatus.Denied | undefined {
    // eslint-disable-next-line @microsoft/sdl/no-cookies -- The legacy cookie is read, never written, so every copy expires within the consent max age.
    const cookies = document.cookie.split('; ');
    return cookies.includes(`${LEGACY_CONSENT_COOKIE}=${EConsentStatus.Denied}`) ? EConsentStatus.Denied : undefined;
}

export function PrivacyPolicyLink({ children }: { children: React.ReactNode }) {
    return (
        <ExternalLink
            href={PRIVACY_POLICY_URL}
            className="text-white underline transition-opacity hover:text-white hover:opacity-70"
        >
            {children}
        </ExternalLink>
    );
}

export function CookieCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            data-testid="cookie-consent"
            className={cn(
                // Below the shared dialog's `z-50`, so a modal dims the banner rather than leaving it lit.
                // Radix disables pointer events outside an open modal, and that kills these buttons too:
                // over the overlay the banner kept full contrast while answering nothing.
                'fixed bottom-2.5 left-2.5 right-2.5 z-40 rounded-lg border border-slate-100 bg-black p-4 [border-style:solid] md:right-auto md:max-w-[400px]',
                className,
            )}
        >
            {children}
        </div>
    );
}

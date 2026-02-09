'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/app/components/shared/utils';

import { getCookie, setCookie } from '../lib/cookie';

export const COOKIE_CONSENT_NAME = 'solana_cookie_consent';
const COOKIE_MAX_AGE = 15778476; // 6 months in seconds
const PRIVACY_POLICY_URL = 'https://solana.com/privacy-policy#collection-of-information';

type TConsentValue = 'granted' | 'denied';

export function CookieConsent() {
    const [consent, setConsent] = useState<TConsentValue | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isEU, setIsEU] = useState<boolean | null>(null);

    useEffect(() => {
        setIsMounted(true);
        const storedConsent = getCookie(COOKIE_CONSENT_NAME) as TConsentValue | null;
        setConsent(storedConsent);

        fetch('/api/geo-location')
            .then(res => res.json())
            .then(data => setIsEU(data.isEU))
            .catch(() => setIsEU(false));
    }, []);

    const handleConsent = (value: TConsentValue) => {
        setCookie(COOKIE_CONSENT_NAME, value, COOKIE_MAX_AGE);
        setConsent(value);
        window.dispatchEvent(new CustomEvent('cookie-consent-change', { detail: value }));
    };

    const handleDismiss = () => {
        setIsDismissed(true);
    };

    if (!isMounted || consent !== null || isDismissed || isEU === null) {
        return null;
    }

    if (isEU) {
        return (
            <CookieCard>
                <div className="e-flex e-items-start e-justify-between">
                    <p className="e-m-0 e-flex-1 e-text-base e-leading-relaxed e-text-white">
                        This website uses cookies to offer you a better browsing experience. Find out more on{' '}
                        <PrivacyPolicyLink>how we use cookies</PrivacyPolicyLink>.
                    </p>
                    <CloseButton onClick={handleDismiss} />
                </div>

                <div className="e-flex e-flex-row e-items-center e-justify-end e-gap-4">
                    <button
                        className="e-cursor-pointer e-border-none e-bg-transparent e-p-0 e-text-sm e-font-medium e-tracking-wider e-text-white e-transition-opacity hover:e-opacity-70"
                        onClick={() => handleConsent('denied')}
                    >
                        OPT-OUT
                    </button>
                    <button className="btn btn-white e-bg-transparent" onClick={() => handleConsent('granted')}>
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

function CloseButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            className="e-cursor-pointer e-border-none e-bg-transparent e-p-0 e-text-2xl e-leading-none e-text-white hover:e-opacity-70"
            onClick={onClick}
        >
            &times;
        </button>
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

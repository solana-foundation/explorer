'use client';

import { getCookie, setCookie } from '@utils/cookie';
import { useEffect, useState } from 'react';

import { cn } from '../shared/utils';

export const COOKIE_CONSENT_NAME = 'solana_cookie_consent';
const COOKIE_MAX_AGE = 15778476; // 6 months in seconds
const PRIVACY_POLICY_URL = 'https://solana.com/privacy-policy#collection-of-information';

type TConsentValue = 'granted' | 'denied';

interface ICookieConsentProps {
    isEU: boolean;
}

export function CookieConsent({ isEU }: ICookieConsentProps) {
    const [consent, setConsent] = useState<TConsentValue | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const storedConsent = getCookie(COOKIE_CONSENT_NAME) as TConsentValue | null;
        setConsent(storedConsent);
    }, []);

    const handleConsent = (value: TConsentValue) => {
        setCookie(COOKIE_CONSENT_NAME, value, COOKIE_MAX_AGE);
        setConsent(value);
        window.location.reload();
    };

    const handleDismiss = () => {
        setIsDismissed(true);
    };

    if (!isMounted || consent !== null || isDismissed) {
        return null;
    }

    if (isEU) {
        return (
            <CookieCard>
                <div className="e-flex e-justify-between e-items-start">
                    <p className="e-m-0 e-text-base e-leading-relaxed e-text-white e-flex-1">
                        This website uses cookies to offer you a better browsing experience. Find out more on{' '}
                        <PrivacyPolicyLink>how we use cookies</PrivacyPolicyLink>.
                    </p>
                    <CloseButton onClick={handleDismiss} />
                </div>

                <div className="e-flex e-justify-end e-gap-4 e-flex-row e-items-center">
                    <button
                        className="e-bg-transparent e-text-white e-p-0 e-border-none e-cursor-pointer e-transition-opacity hover:e-opacity-70 e-text-sm e-font-medium e-tracking-wider"
                        onClick={() => handleConsent('denied')}
                    >
                        OPT-OUT
                    </button>
                    <button
                        className="btn btn-white e-bg-transparent"
                        onClick={() => handleConsent('granted')}
                    >
                        ACCEPT
                    </button>
                </div>
            </CookieCard>
        );
    }

    return (
        <CookieCard className="e-p-3 e-flex e-flex-row e-justify-between e-items-center e-gap-4">
            <p className="e-m-0 e-text-sm e-leading-relaxed e-text-white">
                We use cookies.{' '}
                <PrivacyPolicyLink>Learn more</PrivacyPolicyLink>
            </p>
            <CloseButton onClick={handleDismiss} />
        </CookieCard>
    );
}

function PrivacyPolicyLink({ children }: { children: React.ReactNode }) {
    return (
        <a
            href={PRIVACY_POLICY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="e-text-white e-underline e-transition-opacity hover:e-opacity-70 hover:e-text-white"
        >
            {children}
        </a>
    );
}

function CloseButton ({ onClick }: { onClick: () => void }) {
    return (
        <span className="c-pointer e-text-white e-text-2xl e-leading-none hover:e-opacity-70" onClick={onClick}>
            &times;
        </span>
    );
}

function CookieCard ({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn("e-fixed e-z-[1200] e-bottom-[10px] e-left-[10px] e-right-[10px] e-bg-black e-border e-border-slate-100 [border-style:solid] e-rounded-lg e-p-4 md:e-max-w-[400px] md:e-right-auto", className)}>
            {children}
        </div>
    );
}
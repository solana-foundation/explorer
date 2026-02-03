'use client';

import { localStorageIsAvailable } from '@utils/local-storage';
import { useEffect,useState } from 'react';

export const COOKIE_CONSENT_KEY = 'cookie_consent';
const COOKIE_CONSENT_EXPIRY_MS = 15778476000; // 6 months

export function CookieConsent() {
  const [cookieConsent, setCookieConsent] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false); // prevent hydration mismatch

  const now = new Date().getTime();

  useEffect(() => {
    setIsMounted(true);

    if (!localStorageIsAvailable()) return;

    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);

    if (storedConsent) {
      try {
        const parsed = JSON.parse(storedConsent);

        if (parsed.timeToExpire && now > parsed.timeToExpire) {
          localStorage.removeItem(COOKIE_CONSENT_KEY);
          setCookieConsent(null);
        } else {
          setCookieConsent(parsed.value);
        }
      } catch {
        localStorage.removeItem(COOKIE_CONSENT_KEY);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConsent = (value: boolean) => {
    if (!localStorageIsAvailable()) return;

    const consentData = {
      timeToExpire: now + COOKIE_CONSENT_EXPIRY_MS,
      value,
    };

    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    setCookieConsent(value);

    window.location.reload();
  };

  if (!isMounted || cookieConsent !== null) {
    return null;
  }

  return (
        <div className="e-fixed e-z-[1200] e-bottom-[10px] e-left-[10px] e-right-[10px] e-bg-black e-border e-border-slate-100 [border-style:solid] e-rounded-lg e-p-4 e-flex e-flex-col e-gap-4 md:e-max-w-[400px] md:e-right-auto">
            <p className="e-m-0 e-text-base e-leading-relaxed e-text-white">
                This website uses cookies to offer you a better browsing experience. Find out more on how
                we use cookies.
            </p>

            <div className="e-flex e-justify-between e-gap-4 e-flex-row e-items-center">
                <div className="e-flex e-gap-6 e-text-sm e-font-medium e-tracking-wider">
                    <button
                        className="e-bg-transparent e-text-white e-p-0 e-border-none e-cursor-pointer e-transition-opacity hover:e-opacity-70"
                        onClick={() => handleConsent(false)}
                    >
                        OPT-OUT
                    </button>
                    <a
                        href="https://solana.com/privacy-policy#collection-of-information"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="e-bg-transparent e-text-white e-cursor-pointer e-no-underline e-transition-opacity hover:e-opacity-70 hover:e-text-white"
                    >
                        DETAILS
                    </a>
                </div>

                <button
                    className="btn btn-white e-bg-transparent"
                    onClick={() => handleConsent(true)}
                >
                    ACCEPT
                </button>
            </div>
         </div>
    );
}

'use client';

import Script from 'next/script';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
    getHeliusSearchTurnstileSiteKey,
    getSearchVerificationState,
    registerSearchChallengeCallback,
    subscribeToSearchStateChanges,
    type SearchVerificationState,
} from '@/app/utils/helius-search-auth';

declare global {
    interface Window {
        turnstile?: {
            remove: (widgetId?: string) => void;
            render: (
                container: HTMLElement,
                options: {
                    appearance: 'always';
                    callback: (token: string) => void;
                    'error-callback': () => void;
                    execution: 'render';
                    'expired-callback': () => void;
                    sitekey: string;
                    size: 'normal';
                    'timeout-callback': () => void;
                    theme: 'auto';
                },
            ) => string;
        };
    }
}

function SearchChallengeModal({ children, onCancel }: { children: React.ReactNode; onCancel: () => void }) {
    return (
        <div
            className="position-fixed top-0 start-0 d-flex h-100 w-100 align-items-center justify-content-center p-3"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 2200 }}
        >
            <div className="card shadow-sm border-0" style={{ maxWidth: '28rem', width: '100%' }}>
                <div className="card-body p-4 text-center">
                    <h5 className="card-title mb-2">Verification Required</h5>
                    <p className="text-muted mb-4">Complete the security check to continue using Helius search.</p>
                    <div className="d-flex justify-content-center">{children}</div>
                    <button className="btn btn-link btn-sm mt-3" onClick={onCancel} type="button">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export function HeliusSearchProvider({ children }: { children: React.ReactNode }) {
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [verificationState, setVerificationState] = useState<SearchVerificationState>(getSearchVerificationState());
    const challengeContainerRef = useRef<HTMLDivElement | null>(null);
    const challengeRequestedRef = useRef(false);
    const rejectRef = useRef<((reason?: unknown) => void) | null>(null);
    const resolveRef = useRef<((token: string) => void) | null>(null);
    const widgetIdRef = useRef<string>();

    const cleanupWidget = useCallback(() => {
        if (widgetIdRef.current && window.turnstile) {
            window.turnstile.remove(widgetIdRef.current);
            widgetIdRef.current = undefined;
        }

        if (challengeContainerRef.current) {
            challengeContainerRef.current.innerHTML = '';
        }
    }, []);

    const dismissChallenge = useCallback(() => {
        cleanupWidget();
        challengeRequestedRef.current = false;

        if (rejectRef.current) {
            rejectRef.current(new Error('Search verification was cancelled'));
        }

        rejectRef.current = null;
        resolveRef.current = null;
    }, [cleanupWidget]);

    const renderWidget = useCallback(() => {
        if (!challengeRequestedRef.current || !scriptLoaded || !window.turnstile || !challengeContainerRef.current) {
            return;
        }

        cleanupWidget();

        widgetIdRef.current = window.turnstile.render(challengeContainerRef.current, {
            appearance: 'always',
            callback: token => {
                challengeRequestedRef.current = false;
                cleanupWidget();
                resolveRef.current?.(token);
                resolveRef.current = null;
                rejectRef.current = null;
            },
            'error-callback': () => {
                dismissChallenge();
            },
            execution: 'render',
            'expired-callback': () => {
                renderWidget();
            },
            sitekey: getHeliusSearchTurnstileSiteKey(),
            size: 'normal',
            theme: 'auto',
            'timeout-callback': () => {
                dismissChallenge();
            },
        });
    }, [cleanupWidget, dismissChallenge, scriptLoaded]);

    useEffect(() => {
        const unsubscribe = subscribeToSearchStateChanges(state => {
            setVerificationState(state);
        });

        registerSearchChallengeCallback(
            () =>
                new Promise<string>((resolve, reject) => {
                    rejectRef.current?.(new Error('A new verification challenge started'));
                    resolveRef.current = resolve;
                    rejectRef.current = reject;
                    challengeRequestedRef.current = true;
                    renderWidget();
                }),
        );

        return () => {
            unsubscribe();
            dismissChallenge();
            registerSearchChallengeCallback(() =>
                Promise.reject(new Error('Helius search verification is unavailable')),
            );
        };
    }, [dismissChallenge, renderWidget]);

    useEffect(() => {
        if (verificationState === 'challenging') {
            renderWidget();
        } else {
            cleanupWidget();
        }
    }, [cleanupWidget, renderWidget, verificationState]);

    return (
        <>
            <Script
                id="helius-search-turnstile"
                onReady={() => {
                    setScriptLoaded(true);
                }}
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                strategy="afterInteractive"
            />
            {children}
            {verificationState === 'challenging' ? (
                <SearchChallengeModal onCancel={dismissChallenge}>
                    <div ref={challengeContainerRef} />
                </SearchChallengeModal>
            ) : null}
        </>
    );
}

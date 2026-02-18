'use client';

import { useEffect, useRef, useState } from 'react';

import { CoinGeckoResult, CoingeckoStatus } from '@/app/utils/coingecko';
import { JupiterResult, JupiterStatus, useJupiterVerification } from '@/app/utils/jupiter';
import { FullLegacyTokenInfo, FullTokenInfo } from '@/app/utils/token-info';

import { useVerificationSources } from '../model/use-verification-sources';
import { TokenVerificationButton } from './TokenVerificationButton';
import { TokenVerificationContent } from './TokenVerificationContent';

export type TokenVerificationProps = {
    tokenInfo?: FullTokenInfo | FullLegacyTokenInfo;
    coinInfo?: CoinGeckoResult;
    jupiterInfo?: JupiterResult;
    isTokenInfoLoading?: boolean;
};

export function TokenVerificationBadge({ tokenInfo, coinInfo, jupiterInfo, isTokenInfoLoading }: TokenVerificationProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [alignRight, setAlignRight] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Check if dropdown would overflow viewport and adjust alignment
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const dropdownWidth = 300;
            const wouldOverflow = rect.left + dropdownWidth > window.innerWidth;
            setAlignRight(wouldOverflow);
        }
    }, [isOpen]);

    const { verifiedSources, unverifiedSources, verificationFoundSources } = useVerificationSources({
        coinInfo,
        jupiterInfo,
        tokenInfo,
    });

    const isLoading =
        (Boolean(tokenInfo?.extensions?.coingeckoId) && coinInfo?.status === CoingeckoStatus.Loading) ||
        jupiterInfo?.status === JupiterStatus.Loading ||
        isTokenInfoLoading;

    return (
        <div ref={containerRef} className="e-relative e-w-full md:e-h-[stretch]">
            <TokenVerificationButton
                isLoading={isLoading}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                verifiedSources={verifiedSources}
                verificationFoundSources={verificationFoundSources}
            />

            {/* Dropdown */}
            {isOpen && (
                <TokenVerificationContent
                    verifiedSources={verifiedSources}
                    unverifiedSources={unverifiedSources}
                    verificationFoundSources={verificationFoundSources}
                    alignRight={alignRight}
                />
            )}
        </div>
    );
}

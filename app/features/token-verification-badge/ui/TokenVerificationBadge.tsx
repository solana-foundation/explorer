'use client';

import { FullLegacyTokenInfo, FullTokenInfo } from '@/app/utils/token-info';

import { useTokenVerification } from '../model/use-verification-sources';
import { BaseTokenVerificationBadge } from './BaseTokenVerificationBadge';

export type TokenVerificationBadgeProps = {
    tokenInfo?: FullTokenInfo | FullLegacyTokenInfo;
    isTokenInfoLoading?: boolean;
};

export function TokenVerificationBadge({ tokenInfo, isTokenInfoLoading }: TokenVerificationBadgeProps) {
    const verificationResult = useTokenVerification(tokenInfo);

    return <BaseTokenVerificationBadge verificationResult={verificationResult} isLoading={isTokenInfoLoading} />;
}

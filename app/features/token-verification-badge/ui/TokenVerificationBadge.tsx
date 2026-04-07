'use client';

import { type VerificationTarget } from '../lib/types';
import { useTokenVerification } from '../model/use-verification-sources';
import { BaseTokenVerificationBadge } from './BaseTokenVerificationBadge';

export type TokenVerificationBadgeProps = {
    target: VerificationTarget;
    isTokenInfoLoading?: boolean;
};

export function TokenVerificationBadge({ target, isTokenInfoLoading }: TokenVerificationBadgeProps) {
    const verificationResult = useTokenVerification(target);

    return <BaseTokenVerificationBadge verificationResult={verificationResult} isLoading={isTokenInfoLoading} />;
}

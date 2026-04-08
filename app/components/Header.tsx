import { AccountHeader } from '@components/account/AccountHeader';
import { TokenMarketData } from '@components/common/TokenMarketData';
import { isTokenProgramData } from '@providers/accounts';
import { type ComponentProps, useMemo } from 'react';

import {
    TokenVerificationBadge,
    useCoinGeckoVerification,
    type VerificationTarget,
} from '@/app/features/token-verification-badge';

type HeaderProps = ComponentProps<typeof AccountHeader>;

export function Header({ address, account, tokenInfo, isTokenInfoLoading }: HeaderProps) {
    const coinInfo = useCoinGeckoVerification(address);

    const parsedData = account?.data.parsed;
    const isTokenMint = parsedData && isTokenProgramData(parsedData) && parsedData?.parsed.type === 'mint';

    const verificationTarget: VerificationTarget = useMemo(
        () => ({
            address,
            solflareVerified: tokenInfo && 'verified' in tokenInfo ? tokenInfo.verified : undefined,
        }),
        [address, tokenInfo],
    );

    return (
        <div className="header">
            <div className="header-body e-flex e-flex-col e-items-start e-gap-4 lg:e-flex-row lg:e-items-end lg:e-justify-between lg:e-gap-1">
                <AccountHeader
                    address={address}
                    account={account}
                    tokenInfo={tokenInfo}
                    isTokenInfoLoading={isTokenInfoLoading}
                />
                {isTokenMint && (
                    <div className="e-flex e-w-full e-flex-col e-gap-1 sm:e-items-start sm:e-gap-2 md:e-w-auto md:e-flex-row">
                        <TokenVerificationBadge target={verificationTarget} isTokenInfoLoading={isTokenInfoLoading} />
                        <TokenMarketData coinInfo={coinInfo} />
                    </div>
                )}
            </div>
        </div>
    );
}

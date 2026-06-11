import { AccountHeader } from '@components/account/AccountHeader';
import { TokenMarketData } from '@components/common/TokenMarketData';
import { isTokenProgramData } from '@providers/accounts';
import { type ComponentProps, useMemo } from 'react';

import {
    TokenVerificationBadge,
    useCoinGeckoVerification,
    type VerificationTarget,
} from '@/app/features/token-verification-badge';
import { toKitAddress } from '@/app/shared/lib/web3js-compat';
import { isNativeMint, isTokenMintByOwner } from '@/app/shared/model/token-program';

type HeaderProps = ComponentProps<typeof AccountHeader>;

export function Header({ address, account, tokenInfo, isTokenInfoLoading }: HeaderProps) {
    const parsedData = account?.data.parsed;
    // isTokenProgramData + parsed.type check gonna be replaced with isTokenMintByOwner(owner, data) at some point
    const isTokenMint =
        !isNativeMint(address) &&
        parsedData &&
        isTokenProgramData(parsedData) &&
        parsedData?.parsed.type === 'mint' &&
        isTokenMintByOwner(toKitAddress(account.owner), account.data.raw);

    const coinInfo = useCoinGeckoVerification(address, !!isTokenMint);

    const verificationTarget: VerificationTarget = useMemo(
        () => ({
            address,
            isTokenMint: !!isTokenMint,
            solflareVerified: tokenInfo && 'verified' in tokenInfo ? tokenInfo.verified : undefined,
        }),
        [address, isTokenMint, tokenInfo],
    );

    return (
        <div className="e-mb-8">
            <div className="e-flex e-flex-col e-items-start e-gap-4 e-border-0 e-border-b e-border-solid e-border-dk-gray-700-dark e-py-6 lg:e-flex-row lg:e-items-end lg:e-justify-between lg:e-gap-1">
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

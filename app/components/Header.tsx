import { AccountHeader } from '@components/account/AccountHeader';
import { TokenMarketData } from '@components/common/TokenMarketData';
import { ComponentProps } from 'react';

import { TokenVerificationBadge } from '@/app/features/token-verification-badge';
import { useCoinGecko } from '@/app/utils/coingecko';
import { useJupiterVerification } from '@/app/utils/jupiter';
import { useRugCheck } from '@/app/utils/rugcheck';

type HeaderProps = ComponentProps<typeof AccountHeader>;

export function Header({ address, account, tokenInfo, isTokenInfoLoading }: HeaderProps) {
    const coinInfo = useCoinGecko(tokenInfo?.extensions?.coingeckoId);
    const jupiterInfo = useJupiterVerification(tokenInfo?.address);
    const rugCheckInfo = useRugCheck(tokenInfo?.address);
    

    return (
        <div className="header">
            <div className="header-body e-flex e-flex-col e-items-start e-gap-4 lg:e-flex-row lg:e-items-end lg:e-justify-between lg:e-gap-1">
                <AccountHeader
                    address={address}
                    account={account}
                    tokenInfo={tokenInfo}
                    isTokenInfoLoading={isTokenInfoLoading}
                />
                <div className="e-flex e-flex-col e-w-full md:e-w-auto e-gap-1 md:e-flex-row sm:e-items-start sm:e-gap-2">
                    <TokenVerificationBadge tokenInfo={tokenInfo} coinInfo={coinInfo} jupiterInfo={jupiterInfo} rugCheckInfo={rugCheckInfo} isTokenInfoLoading={isTokenInfoLoading} />
                    <TokenMarketData tokenInfo={tokenInfo} coinInfo={coinInfo} />
                </div>
            </div>
        </div>
    );
}

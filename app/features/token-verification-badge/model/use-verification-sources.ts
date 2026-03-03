import { FullLegacyTokenInfo, FullTokenInfo } from '@/app/utils/token-info';

import { EVerificationSource, VerificationSource } from '../lib/types';
import { BlupryntStatus, useBlupryntVerification } from './use-bluprynt';
import { CoingeckoStatus, useCoinGeckoVerification } from './use-coingecko';
import { JupiterStatus, useJupiterVerification } from './use-jupiter';
import { getRiskLevel, RugCheckStatus, useRugCheckVerification } from './use-rugcheck';

export type TokenVerificationResult = {
    rateLimitedSources: VerificationSource[];
    sources: VerificationSource[];
    sourcesToApply: VerificationSource[];
    verificationFoundSources: VerificationSource[];
};

export function useTokenVerification(tokenInfo?: FullTokenInfo | FullLegacyTokenInfo): TokenVerificationResult {
    const blupryntInfo = useBlupryntVerification(tokenInfo?.address);
    const coinInfo = useCoinGeckoVerification(tokenInfo?.extensions?.coingeckoId);
    const jupiterInfo = useJupiterVerification(tokenInfo?.address);
    const rugCheckInfo = useRugCheckVerification(tokenInfo?.address);

    const blupryntVerified = blupryntInfo?.status === BlupryntStatus.Success && blupryntInfo.verified;
    const coingeckoVerified = !!tokenInfo?.extensions?.coingeckoId && coinInfo?.status === CoingeckoStatus.Success;
    const solflareVerified = tokenInfo && 'verified' in tokenInfo ? tokenInfo.verified : false;
    const jupiterVerified = jupiterInfo?.status === JupiterStatus.Success && jupiterInfo.verified;
    const rugCheckVerified = rugCheckInfo?.status === RugCheckStatus.Success && rugCheckInfo.verified;

    const rugCheckScore = rugCheckInfo?.status === RugCheckStatus.Success ? rugCheckInfo.score : undefined;
    const rugCheckLevel = rugCheckScore !== undefined ? getRiskLevel(rugCheckScore) : undefined;

    const sources: VerificationSource[] = [
        {
            applyUrl: 'https://app.bluprynt.com/register/account?integration_partner=solana_explorer',
            isRateLimited: blupryntInfo?.status === BlupryntStatus.RateLimited,
            isVerificationFound: blupryntInfo?.status === BlupryntStatus.Success,
            name: EVerificationSource.Bluprynt,
            url: `https://verified.bluprynt.com/verified-assets/${tokenInfo?.address}/solana`,
            verified: blupryntVerified,
        },
        {
            applyUrl:
                'https://support.coingecko.com/hc/en-us/articles/23725417857817-Verification-Guide-for-Listing-Update-Requests-on-CoinGecko',
            isRateLimited: coinInfo?.status === CoingeckoStatus.RateLimited,
            isVerificationFound: Boolean(
                tokenInfo?.extensions?.coingeckoId && coinInfo?.status === CoingeckoStatus.Success
            ),
            name: EVerificationSource.CoinGecko,
            url: `https://www.coingecko.com/en/coins/${tokenInfo?.extensions?.coingeckoId}`,
            verified: coingeckoVerified,
        },
        {
            applyUrl: 'https://verified.jup.ag/tokens',
            isRateLimited: jupiterInfo?.status === JupiterStatus.RateLimited,
            isVerificationFound: jupiterInfo?.status === JupiterStatus.Success,
            name: EVerificationSource.Jupiter,
            url: `https://jup.ag/tokens/${tokenInfo?.address}`,
            verified: jupiterVerified,
        },
        {
            applyUrl: 'https://help.solflare.com/en/articles/9260147-i-cannot-find-a-token-in-solflare',
            isVerificationFound: tokenInfo && 'verified' in tokenInfo,
            name: EVerificationSource.Solflare,
            url: `https://www.solflare.com/prices/${tokenInfo?.address}`,
            verified: solflareVerified,
        },
        {
            applyUrl: 'https://rugcheck.xyz/verify/token',
            isRateLimited: rugCheckInfo?.status === RugCheckStatus.RateLimited,
            isVerificationFound: rugCheckInfo?.status === RugCheckStatus.Success,
            level: rugCheckLevel,
            name: EVerificationSource.RugCheck,
            score: rugCheckScore,
            url: `https://rugcheck.xyz/tokens/${tokenInfo?.address}`,
            verified: rugCheckVerified,
        },
    ];

    const rateLimitedSources = sources.filter(s => s.isRateLimited);
    const sourcesToApply = sources.filter(s => !s.verified && !s.isVerificationFound && !s.isRateLimited);
    const verificationFoundSources = sources.filter(s => s.isVerificationFound);

    return { rateLimitedSources, sources, sourcesToApply, verificationFoundSources };
}

import Image from 'next/image';
import { useMemo } from 'react';

import { CoingeckoStatus } from '@/app/utils/coingecko';
import { JupiterStatus } from '@/app/utils/jupiter';
import { getRiskLevel, RISK_MAX_LEVEL_GOOD, RugCheckStatus } from '@/app/utils/rugcheck';

import CoinGeckoLogo from '../icons/coingecko-logo.png';
import JupiterLogo from '../icons/jupiter-logo.png';
import RugCheckLogo from '../icons/rugcheck-logo.png';
import SolflareLogo from '../icons/solflare-logo.png';
import { VerificationSource } from '../lib/types';
import { TokenVerificationProps } from '../ui/TokenVerificationBadge';

const ICON_SIZE = 20;

function Icon({ src, alt }: { src: typeof SolflareLogo; alt: string }) {
    return <Image src={src} alt={alt} width={ICON_SIZE} height={ICON_SIZE} className="e-rounded-full" />;
}

export enum EVerificationSource {
    CoinGecko = 'CoinGecko',
    Solflare = 'Solflare',
    Jupiter = 'Jupiter',
    RugCheck = 'RugCheck',
}

export function useVerificationSources({ tokenInfo, coinInfo, jupiterInfo, rugCheckInfo }: TokenVerificationProps): {
    sources: VerificationSource[];
    verifiedSources: VerificationSource[];
    unverifiedSources: VerificationSource[];
    verificationFoundSources: VerificationSource[];
} {
    const coingeckoVerified = !!tokenInfo?.extensions?.coingeckoId && coinInfo?.status === CoingeckoStatus.Success;
    const solflareVerified = tokenInfo && 'verified' in tokenInfo ? tokenInfo.verified : false;
    const jupiterVerified = jupiterInfo?.status === JupiterStatus.Success && jupiterInfo.verified;

    const rugCheckScore = rugCheckInfo?.status === RugCheckStatus.Success ? rugCheckInfo.score : undefined;
    const rugCheckLevel = rugCheckScore !== undefined ? getRiskLevel(rugCheckScore) : undefined;
    const rugCheckVerified = rugCheckScore !== undefined && rugCheckScore <= RISK_MAX_LEVEL_GOOD;

    const sources: VerificationSource[] = useMemo(
        () => [
            {
                applyUrl:
                    'https://support.coingecko.com/hc/en-us/articles/23725417857817-Verification-Guide-for-Listing-Update-Requests-on-CoinGecko',
                icon: <Icon src={CoinGeckoLogo} alt="CoinGecko" />,
                isVerificationFound: Boolean(tokenInfo?.extensions?.coingeckoId),
                name: EVerificationSource.CoinGecko,
                verified: coingeckoVerified,
            },
            {
                applyUrl: 'https://help.solflare.com/en/articles/9260147-i-cannot-find-a-token-in-solflare',
                icon: <Icon src={SolflareLogo} alt="Solflare" />,
                isVerificationFound: Boolean(tokenInfo),
                name: EVerificationSource.Solflare,
                verified: solflareVerified,
            },
            {
                applyUrl: 'https://catdetlist.jup.ag/',
                icon: <Icon src={JupiterLogo} alt="Jupiter" />,
                isVerificationFound: jupiterInfo?.status === JupiterStatus.Success,
                name: EVerificationSource.Jupiter,
                verified: jupiterVerified,
            },
            {
                applyUrl: 'https://rugcheck.xyz/',
                icon: <Icon src={RugCheckLogo} alt="RugCheck" />,
                isVerificationFound: rugCheckInfo?.status === RugCheckStatus.Success,
                level: rugCheckLevel,
                name: EVerificationSource.RugCheck,
                score: rugCheckScore,
                verified: rugCheckVerified,
            },
        ],
        [
            coingeckoVerified,
            solflareVerified,
            jupiterVerified,
            jupiterInfo,
            rugCheckInfo,
            rugCheckScore,
            rugCheckLevel,
            rugCheckVerified,
            tokenInfo,
        ]
    );

    const verifiedSources = sources.filter(s => s.verified);
    const unverifiedSources = sources.filter(s => !s.verified);
    const verificationFoundSources = sources.filter(s => s.isVerificationFound);

    return { sources, unverifiedSources, verificationFoundSources, verifiedSources };
}

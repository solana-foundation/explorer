import { EVerificationSource, VerificationSource } from '../../lib/types';
import { ERiskLevel } from '../../model/use-rugcheck';
import { TokenVerificationResult } from '../../model/use-verification-sources';

const MOCK_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export const mockBlupryntSource = (overrides?: Partial<VerificationSource>): VerificationSource => ({
    applyUrl: 'https://verified.bluprynt.com/assets/new',
    isVerificationFound: true,
    name: EVerificationSource.Bluprynt,
    url: `https://verified.bluprynt.com/verified-assets/${MOCK_ADDRESS}/solana`,
    verified: true,
    ...overrides,
});

export const mockCoinGeckoSource = (overrides?: Partial<VerificationSource>): VerificationSource => ({
    applyUrl:
        'https://support.coingecko.com/hc/en-us/articles/23725417857817-Verification-Guide-for-Listing-Update-Requests-on-CoinGecko',
    isVerificationFound: true,
    name: EVerificationSource.CoinGecko,
    url: `https://www.coingecko.com/en/coins/usd-coin`,
    verified: true,
    ...overrides,
});

export const mockJupiterSource = (overrides?: Partial<VerificationSource>): VerificationSource => ({
    applyUrl: 'https://verified.jup.ag/tokens',
    isVerificationFound: true,
    name: EVerificationSource.Jupiter,
    url: `https://jup.ag/tokens/${MOCK_ADDRESS}`,
    verified: true,
    ...overrides,
});

export const mockSolflareSource = (overrides?: Partial<VerificationSource>): VerificationSource => ({
    applyUrl: 'https://help.solflare.com/en/articles/9260147-i-cannot-find-a-token-in-solflare',
    isVerificationFound: true,
    name: EVerificationSource.Solflare,
    url: `https://www.solflare.com/prices/${MOCK_ADDRESS}`,
    verified: true,
    ...overrides,
});

export const mockRugCheckSource = (overrides?: Partial<VerificationSource>): VerificationSource => ({
    applyUrl: 'https://rugcheck.xyz/auth?redirectTo=%2Fauth',
    isVerificationFound: true,
    level: ERiskLevel.Good,
    name: EVerificationSource.RugCheck,
    score: 15,
    url: `https://rugcheck.xyz/tokens/${MOCK_ADDRESS}`,
    verified: true,
    ...overrides,
});

export const mockAllVerifiedSources = (): VerificationSource[] => [
    mockBlupryntSource(),
    mockCoinGeckoSource(),
    mockJupiterSource(),
    mockSolflareSource(),
    mockRugCheckSource(),
];

export const mockPartiallyVerifiedSources = (): VerificationSource[] => [
    mockBlupryntSource({ isVerificationFound: false, verified: false }),
    mockCoinGeckoSource(),
    mockJupiterSource(),
    mockSolflareSource({ isVerificationFound: false, verified: false }),
    mockRugCheckSource({ level: ERiskLevel.Warning, score: 45 }),
];

export const mockNotVerifiedSources = (): VerificationSource[] => [
    mockBlupryntSource({ isVerificationFound: false, verified: false }),
    mockCoinGeckoSource({ isVerificationFound: false, verified: false }),
    mockJupiterSource({ isVerificationFound: false, verified: false }),
    mockSolflareSource({ isVerificationFound: false, verified: false }),
    mockRugCheckSource({ isVerificationFound: false, level: undefined, score: undefined, verified: false }),
];

export const mockRateLimitedSources = (): VerificationSource[] => [
    mockBlupryntSource(),
    mockCoinGeckoSource({ isRateLimited: true, isVerificationFound: false, verified: false }),
    mockJupiterSource({ isRateLimited: true, isVerificationFound: false, verified: false }),
    mockSolflareSource(),
    mockRugCheckSource({
        isRateLimited: true,
        isVerificationFound: false,
        level: undefined,
        score: undefined,
        verified: false,
    }),
];

export const mockDangerousTokenSources = (): VerificationSource[] => [
    mockBlupryntSource({ isVerificationFound: false, verified: false }),
    mockCoinGeckoSource({ isVerificationFound: false, verified: false }),
    mockJupiterSource({ isVerificationFound: false, verified: false }),
    mockSolflareSource({ isVerificationFound: false, verified: false }),
    mockRugCheckSource({ level: ERiskLevel.Danger, score: 85 }),
];

// Helper to create TokenVerificationResult
export const createMockVerificationResult = (sources: VerificationSource[]): TokenVerificationResult => {
    const rateLimitedSources = sources.filter(s => s.isRateLimited);
    const sourcesToApply = sources.filter(s => !s.verified && !s.isVerificationFound && !s.isRateLimited);
    const verificationFoundSources = sources.filter(s => s.isVerificationFound);

    return {
        rateLimitedSources,
        sources,
        sourcesToApply,
        verificationFoundSources,
    };
};

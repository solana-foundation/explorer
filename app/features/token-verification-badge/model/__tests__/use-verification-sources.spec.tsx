import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EVerificationSource, type VerificationSource, type VerificationTarget } from '../../lib/types';
import { CoingeckoStatus, useCoinGeckoVerification } from '../use-coingecko';
import { JupiterStatus, useJupiterVerification } from '../use-jupiter';
import { ERiskLevel, RugCheckStatus, useRugCheckVerification } from '../use-rugcheck';
import { useTokenVerification } from '../use-verification-sources';

vi.mock('../use-coingecko', async importOriginal => {
    const original = await importOriginal<typeof import('../use-coingecko')>();
    return {
        ...original,
        useCoinGeckoVerification: vi.fn(),
    };
});

vi.mock('../use-jupiter', async importOriginal => {
    const original = await importOriginal<typeof import('../use-jupiter')>();
    return {
        ...original,
        useJupiterVerification: vi.fn(),
    };
});

vi.mock('../use-rugcheck', async importOriginal => {
    const original = await importOriginal<typeof import('../use-rugcheck')>();
    return {
        ...original,
        useRugCheckVerification: vi.fn(),
    };
});

const baseTarget: VerificationTarget = {
    address: 'token-address',
    solflareVerified: true,
};

const legacyTarget: VerificationTarget = {
    address: 'token-address',
};

describe('useTokenVerification', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useCoinGeckoVerification).mockReturnValue(undefined);
        vi.mocked(useJupiterVerification).mockReturnValue(undefined);
        vi.mocked(useRugCheckVerification).mockReturnValue(undefined);
    });

    it.each<
        [
            string,
            EVerificationSource,
            {
                coingecko?: ReturnType<typeof useCoinGeckoVerification>;
                jupiter?: ReturnType<typeof useJupiterVerification>;
                rugcheck?: ReturnType<typeof useRugCheckVerification>;
                target?: VerificationTarget;
            },
            Partial<VerificationSource>,
        ]
    >([
        [
            'CoinGecko as verified, linked to GeckoTerminal, when status is Success and gt_verified is true',
            EVerificationSource.CoinGecko,
            { coingecko: { status: CoingeckoStatus.Success, verified: true } },
            {
                isVerificationFound: true,
                url: `https://www.geckoterminal.com/solana/tokens/${baseTarget.address}`,
                verified: true,
            },
        ],
        [
            'CoinGecko as linked to the coin page when a coinGeckoId is present',
            EVerificationSource.CoinGecko,
            { coingecko: { coinGeckoId: 'usd-coin', status: CoingeckoStatus.Success, verified: true } },
            { url: 'https://www.coingecko.com/en/coins/usd-coin' },
        ],
        [
            'CoinGecko as found but not verified when status is Success but gt_verified is false',
            EVerificationSource.CoinGecko,
            { coingecko: { status: CoingeckoStatus.Success, verified: false } },
            { isVerificationFound: true, verified: false },
        ],
        [
            'CoinGecko as not verified when status is FetchFailed',
            EVerificationSource.CoinGecko,
            { coingecko: { status: CoingeckoStatus.FetchFailed, verified: false } },
            { isVerificationFound: false, verified: false },
        ],
        [
            'CoinGecko as rate limited when status is RateLimited',
            EVerificationSource.CoinGecko,
            { coingecko: { status: CoingeckoStatus.RateLimited, verified: false } },
            { isRateLimited: true, isVerificationFound: false, verified: false },
        ],
        [
            'Jupiter as verified when status is Success and verified is true',
            EVerificationSource.Jupiter,
            { jupiter: { status: JupiterStatus.Success, verified: true } },
            { isVerificationFound: true, verified: true },
        ],
        [
            'Jupiter as not verified when status is Success but verified is false',
            EVerificationSource.Jupiter,
            { jupiter: { status: JupiterStatus.Success, verified: false } },
            { isVerificationFound: true, verified: false },
        ],
        [
            'Jupiter as rate limited when status is RateLimited',
            EVerificationSource.Jupiter,
            { jupiter: { status: JupiterStatus.RateLimited, verified: false } },
            { isRateLimited: true, verified: false },
        ],
        [
            'Solflare as verified when solflareVerified is true',
            EVerificationSource.Solflare,
            {},
            { isVerificationFound: true, verified: true },
        ],
        [
            'Solflare as not verified when solflareVerified is false',
            EVerificationSource.Solflare,
            { target: { ...baseTarget, solflareVerified: false } },
            { isVerificationFound: true, verified: false },
        ],
        [
            'Solflare as not found when solflareVerified is undefined',
            EVerificationSource.Solflare,
            { target: legacyTarget },
            { isVerificationFound: false, verified: false },
        ],
        [
            'RugCheck as verified with level Good when score <= 25',
            EVerificationSource.RugCheck,
            { rugcheck: { score: 15, status: RugCheckStatus.Success, verified: true } },
            { isVerificationFound: true, level: ERiskLevel.Good, score: 15, verified: true },
        ],
        [
            'RugCheck as not verified with level Warning when score > 25 and <= 65',
            EVerificationSource.RugCheck,
            { rugcheck: { score: 45, status: RugCheckStatus.Success, verified: false } },
            { isVerificationFound: true, level: ERiskLevel.Warning, score: 45, verified: false },
        ],
        [
            'RugCheck as not verified with level Danger when score > 65',
            EVerificationSource.RugCheck,
            { rugcheck: { score: 85, status: RugCheckStatus.Success, verified: false } },
            { isVerificationFound: true, level: ERiskLevel.Danger, score: 85, verified: false },
        ],
        [
            'RugCheck as rate limited, with no level, when status is RateLimited',
            EVerificationSource.RugCheck,
            { rugcheck: { score: undefined, status: RugCheckStatus.RateLimited, verified: false } },
            { isRateLimited: true, level: undefined, verified: false },
        ],
        [
            'RugCheck with no level when status is FetchFailed',
            EVerificationSource.RugCheck,
            { rugcheck: { score: undefined, status: RugCheckStatus.FetchFailed, verified: false } },
            { isVerificationFound: false, level: undefined, verified: false },
        ],
    ])('should map %s', (_label, name, { coingecko, jupiter, rugcheck, target = baseTarget }, expected) => {
        vi.mocked(useCoinGeckoVerification).mockReturnValue(coingecko);
        vi.mocked(useJupiterVerification).mockReturnValue(jupiter);
        vi.mocked(useRugCheckVerification).mockReturnValue(rugcheck);

        const { result } = renderHook(() => useTokenVerification(target));

        expect(result.current.sources.find(s => s.name === name)).toMatchObject(expected);
    });

    it('should list every source as found, and none to apply, when all are verified', () => {
        vi.mocked(useCoinGeckoVerification).mockReturnValue({
            status: CoingeckoStatus.Success,
            verified: true,
        });
        vi.mocked(useJupiterVerification).mockReturnValue({
            status: JupiterStatus.Success,
            verified: true,
        });
        vi.mocked(useRugCheckVerification).mockReturnValue({
            score: 20,
            status: RugCheckStatus.Success,
            verified: true,
        });

        const { result } = renderHook(() => useTokenVerification(baseTarget));

        expect(result.current.verificationFoundSources.map(s => s.name)).toEqual([
            EVerificationSource.CoinGecko,
            EVerificationSource.Jupiter,
            EVerificationSource.Solflare,
            EVerificationSource.RugCheck,
        ]);
        expect(result.current.sourcesToApply).toHaveLength(0);
    });

    describe('verificationFoundSources', () => {
        it('should exclude sources with isVerificationFound false', () => {
            vi.mocked(useCoinGeckoVerification).mockReturnValue({
                status: CoingeckoStatus.FetchFailed,
                verified: false,
            });
            vi.mocked(useJupiterVerification).mockReturnValue({
                status: JupiterStatus.FetchFailed,
                verified: false,
            });
            vi.mocked(useRugCheckVerification).mockReturnValue({
                score: undefined,
                status: RugCheckStatus.FetchFailed,
                verified: false,
            });

            const { result } = renderHook(() => useTokenVerification(baseTarget));

            expect(result.current.verificationFoundSources).toHaveLength(1);
            expect(result.current.verificationFoundSources[0].name).toBe(EVerificationSource.Solflare);
        });
    });

    describe('sourcesToApply', () => {
        it('should include sources that are not verified, not found, and not rate limited', () => {
            vi.mocked(useCoinGeckoVerification).mockReturnValue({
                status: CoingeckoStatus.FetchFailed,
                verified: false,
            });
            vi.mocked(useJupiterVerification).mockReturnValue({
                status: JupiterStatus.FetchFailed,
                verified: false,
            });
            vi.mocked(useRugCheckVerification).mockReturnValue({
                score: undefined,
                status: RugCheckStatus.FetchFailed,
                verified: false,
            });

            const unverifiedTarget: VerificationTarget = { ...baseTarget, solflareVerified: false };
            const { result } = renderHook(() => useTokenVerification(unverifiedTarget));

            expect(result.current.sourcesToApply).toHaveLength(3);
            expect(result.current.sourcesToApply.map(s => s.name)).toEqual([
                EVerificationSource.CoinGecko,
                EVerificationSource.Jupiter,
                EVerificationSource.RugCheck,
            ]);
        });

        it('should exclude rate limited sources from sourcesToApply', () => {
            vi.mocked(useCoinGeckoVerification).mockReturnValue({
                status: CoingeckoStatus.FetchFailed,
                verified: false,
            });
            vi.mocked(useJupiterVerification).mockReturnValue({
                status: JupiterStatus.RateLimited,
                verified: false,
            });
            vi.mocked(useRugCheckVerification).mockReturnValue({
                score: undefined,
                status: RugCheckStatus.RateLimited,
                verified: false,
            });

            const unverifiedTarget: VerificationTarget = { ...baseTarget, solflareVerified: false };
            const { result } = renderHook(() => useTokenVerification(unverifiedTarget));

            expect(result.current.sourcesToApply).toHaveLength(1);
            expect(result.current.sourcesToApply[0].name).toBe(EVerificationSource.CoinGecko);
        });

        it('should exclude sources with verification found from sourcesToApply', () => {
            vi.mocked(useCoinGeckoVerification).mockReturnValue({
                status: CoingeckoStatus.FetchFailed,
                verified: false,
            });
            vi.mocked(useJupiterVerification).mockReturnValue({
                status: JupiterStatus.Success,
                verified: false,
            });
            vi.mocked(useRugCheckVerification).mockReturnValue({
                score: undefined,
                status: RugCheckStatus.FetchFailed,
                verified: false,
            });

            const unverifiedTarget: VerificationTarget = { ...baseTarget, solflareVerified: false };
            const { result } = renderHook(() => useTokenVerification(unverifiedTarget));

            expect(result.current.sourcesToApply.map(s => s.name)).not.toContain(EVerificationSource.Jupiter);
        });
    });

    describe('edge cases', () => {
        it('should handle mint with only address', () => {
            const { result } = renderHook(() => useTokenVerification({ address: 'some-address' }));

            expect(result.current.sources).toHaveLength(4);
            expect(result.current.verificationFoundSources).toHaveLength(0);
        });

        it('should handle mixed verification states', () => {
            vi.mocked(useCoinGeckoVerification).mockReturnValue({
                status: CoingeckoStatus.RateLimited,
                verified: false,
            });
            vi.mocked(useJupiterVerification).mockReturnValue({
                status: JupiterStatus.Success,
                verified: false,
            });
            vi.mocked(useRugCheckVerification).mockReturnValue({
                score: 50,
                status: RugCheckStatus.Success,
                verified: false,
            });

            const { result } = renderHook(() => useTokenVerification(baseTarget));

            expect(result.current.verificationFoundSources.map(s => s.name)).toEqual([
                EVerificationSource.Jupiter,
                EVerificationSource.Solflare,
                EVerificationSource.RugCheck,
            ]);
            expect(result.current.rateLimitedSources.map(s => s.name)).toEqual([EVerificationSource.CoinGecko]);
            expect(result.current.sourcesToApply).toHaveLength(0);
        });
    });
});

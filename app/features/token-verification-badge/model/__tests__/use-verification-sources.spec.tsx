import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FullLegacyTokenInfo, FullTokenInfo } from '@/app/utils/token-info';

import { EVerificationSource } from '../../lib/types';
import { BlupryntStatus, useBlupryntVerification } from '../use-bluprynt';
import { CoingeckoStatus, useCoinGeckoVerification } from '../use-coingecko';
import { JupiterStatus, useJupiterVerification } from '../use-jupiter';
import { ERiskLevel, RugCheckStatus, useRugCheckVerification } from '../use-rugcheck';
import { useTokenVerification } from '../use-verification-sources';

vi.mock('../use-bluprynt', async importOriginal => {
    const original = await importOriginal<typeof import('../use-bluprynt')>();
    return {
        ...original,
        useBlupryntVerification: vi.fn(),
    };
});

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

const baseTokenInfo: FullTokenInfo = {
    address: 'token-address',
    chainId: 101,
    decimals: 6,
    extensions: { coingeckoId: 'token-id' },
    name: 'Test Token',
    symbol: 'TEST',
    verified: true,
};

const legacyTokenInfo: FullLegacyTokenInfo = {
    address: 'token-address',
    chainId: 101,
    decimals: 6,
    extensions: { coingeckoId: 'token-id' },
    logoURI: 'https://example.com/logo.png',
    name: 'Test Token',
    symbol: 'TEST',
};

describe('useTokenVerification', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useBlupryntVerification).mockReturnValue(undefined);
        vi.mocked(useCoinGeckoVerification).mockReturnValue(undefined);
        vi.mocked(useJupiterVerification).mockReturnValue(undefined);
        vi.mocked(useRugCheckVerification).mockReturnValue(undefined);
    });

    describe('Bluprynt verification', () => {
        it('should mark as verified when status is Success and verified is true', () => {
            vi.mocked(useBlupryntVerification).mockReturnValue({
                status: BlupryntStatus.Success,
                verified: true,
            });

            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));
            const bluprynt = result.current.sources.find(s => s.name === EVerificationSource.Bluprynt);

            expect(bluprynt?.verified).toBe(true);
            expect(bluprynt?.isVerificationFound).toBe(true);
        });

        it('should mark as not verified when status is Success but verified is false', () => {
            vi.mocked(useBlupryntVerification).mockReturnValue({
                status: BlupryntStatus.Success,
                verified: false,
            });

            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));
            const bluprynt = result.current.sources.find(s => s.name === EVerificationSource.Bluprynt);

            expect(bluprynt?.verified).toBe(false);
            expect(bluprynt?.isVerificationFound).toBe(true);
        });

        it('should mark isVerificationFound as false when status is FetchFailed', () => {
            vi.mocked(useBlupryntVerification).mockReturnValue({
                status: BlupryntStatus.FetchFailed,
                verified: false,
            });

            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));
            const bluprynt = result.current.sources.find(s => s.name === EVerificationSource.Bluprynt);

            expect(bluprynt?.verified).toBe(false);
            expect(bluprynt?.isVerificationFound).toBe(false);
        });
    });

    describe('CoinGecko verification', () => {
        it('should mark as verified when coingeckoId exists and status is Success', () => {
            vi.mocked(useCoinGeckoVerification).mockReturnValue({
                status: CoingeckoStatus.Success,
            });

            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));
            const coingecko = result.current.sources.find(s => s.name === EVerificationSource.CoinGecko);

            expect(coingecko?.verified).toBe(true);
            expect(coingecko?.isVerificationFound).toBe(true);
        });

        it('should mark as not verified when coingeckoId is missing', () => {
            vi.mocked(useCoinGeckoVerification).mockReturnValue({
                status: CoingeckoStatus.Success,
            });
            const tokenWithoutCoingecko = { ...baseTokenInfo, extensions: {} };

            const { result } = renderHook(() => useTokenVerification(tokenWithoutCoingecko));
            const coingecko = result.current.sources.find(s => s.name === EVerificationSource.CoinGecko);

            expect(coingecko?.verified).toBe(false);
            expect(coingecko?.isVerificationFound).toBe(false);
        });

        it('should mark as rate limited when status is RateLimited', () => {
            vi.mocked(useCoinGeckoVerification).mockReturnValue({
                status: CoingeckoStatus.RateLimited,
            });

            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));
            const coingecko = result.current.sources.find(s => s.name === EVerificationSource.CoinGecko);

            expect(coingecko?.isRateLimited).toBe(true);
            expect(coingecko?.verified).toBe(false);
            expect(coingecko?.isVerificationFound).toBe(false);
        });
    });

    describe('Jupiter verification', () => {
        it('should mark as verified when status is Success and verified is true', () => {
            vi.mocked(useJupiterVerification).mockReturnValue({
                status: JupiterStatus.Success,
                verified: true,
            });

            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));
            const jupiter = result.current.sources.find(s => s.name === EVerificationSource.Jupiter);

            expect(jupiter?.verified).toBe(true);
            expect(jupiter?.isVerificationFound).toBe(true);
        });

        it('should mark as not verified when status is Success but verified is false', () => {
            vi.mocked(useJupiterVerification).mockReturnValue({
                status: JupiterStatus.Success,
                verified: false,
            });

            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));
            const jupiter = result.current.sources.find(s => s.name === EVerificationSource.Jupiter);

            expect(jupiter?.verified).toBe(false);
            expect(jupiter?.isVerificationFound).toBe(true);
        });

        it('should mark as rate limited when status is RateLimited', () => {
            vi.mocked(useJupiterVerification).mockReturnValue({
                status: JupiterStatus.RateLimited,
                verified: false,
            });

            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));
            const jupiter = result.current.sources.find(s => s.name === EVerificationSource.Jupiter);

            expect(jupiter?.isRateLimited).toBe(true);
            expect(jupiter?.verified).toBe(false);
        });
    });

    describe('Solflare verification', () => {
        it('should mark as verified when tokenInfo has verified property set to true', () => {
            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));
            const solflare = result.current.sources.find(s => s.name === EVerificationSource.Solflare);

            expect(solflare?.verified).toBe(true);
            expect(solflare?.isVerificationFound).toBe(true);
        });

        it('should mark as not verified when tokenInfo has verified property set to false', () => {
            const unverifiedToken = { ...baseTokenInfo, verified: false };

            const { result } = renderHook(() => useTokenVerification(unverifiedToken));
            const solflare = result.current.sources.find(s => s.name === EVerificationSource.Solflare);

            expect(solflare?.verified).toBe(false);
            expect(solflare?.isVerificationFound).toBe(true);
        });

        it('should mark isVerificationFound as false when tokenInfo lacks verified property', () => {
            const { result } = renderHook(() => useTokenVerification(legacyTokenInfo));
            const solflare = result.current.sources.find(s => s.name === EVerificationSource.Solflare);

            expect(solflare?.verified).toBe(false);
            expect(solflare?.isVerificationFound).toBe(false);
        });
    });

    describe('RugCheck verification', () => {
        it('should mark as verified with level Good when score <= 25', () => {
            vi.mocked(useRugCheckVerification).mockReturnValue({
                score: 15,
                status: RugCheckStatus.Success,
                verified: true,
            });

            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));
            const rugcheck = result.current.sources.find(s => s.name === EVerificationSource.RugCheck);

            expect(rugcheck?.verified).toBe(true);
            expect(rugcheck?.level).toBe(ERiskLevel.Good);
            expect(rugcheck?.score).toBe(15);
            expect(rugcheck?.isVerificationFound).toBe(true);
        });

        it('should mark as not verified with level Warning when score > 25 and <= 65', () => {
            vi.mocked(useRugCheckVerification).mockReturnValue({
                score: 45,
                status: RugCheckStatus.Success,
                verified: false,
            });

            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));
            const rugcheck = result.current.sources.find(s => s.name === EVerificationSource.RugCheck);

            expect(rugcheck?.verified).toBe(false);
            expect(rugcheck?.level).toBe(ERiskLevel.Warning);
            expect(rugcheck?.score).toBe(45);
            expect(rugcheck?.isVerificationFound).toBe(true);
        });

        it('should mark as not verified with level Danger when score > 65', () => {
            vi.mocked(useRugCheckVerification).mockReturnValue({
                score: 85,
                status: RugCheckStatus.Success,
                verified: false,
            });

            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));
            const rugcheck = result.current.sources.find(s => s.name === EVerificationSource.RugCheck);

            expect(rugcheck?.verified).toBe(false);
            expect(rugcheck?.level).toBe(ERiskLevel.Danger);
            expect(rugcheck?.score).toBe(85);
            expect(rugcheck?.isVerificationFound).toBe(true);
        });

        it('should mark as rate limited when status is RateLimited', () => {
            vi.mocked(useRugCheckVerification).mockReturnValue({
                score: undefined,
                status: RugCheckStatus.RateLimited,
                verified: false,
            });

            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));
            const rugcheck = result.current.sources.find(s => s.name === EVerificationSource.RugCheck);

            expect(rugcheck?.isRateLimited).toBe(true);
            expect(rugcheck?.verified).toBe(false);
            expect(rugcheck?.level).toBeUndefined();
        });

        it('should have undefined level when status is FetchFailed', () => {
            vi.mocked(useRugCheckVerification).mockReturnValue({
                score: undefined,
                status: RugCheckStatus.FetchFailed,
                verified: false,
            });

            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));
            const rugcheck = result.current.sources.find(s => s.name === EVerificationSource.RugCheck);

            expect(rugcheck?.verified).toBe(false);
            expect(rugcheck?.level).toBeUndefined();
            expect(rugcheck?.isVerificationFound).toBe(false);
        });
    });

    describe('verificationFoundSources', () => {
        it('should include all sources with isVerificationFound true', () => {
            vi.mocked(useBlupryntVerification).mockReturnValue({
                status: BlupryntStatus.Success,
                verified: true,
            });
            vi.mocked(useCoinGeckoVerification).mockReturnValue({
                status: CoingeckoStatus.Success,
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

            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));

            expect(result.current.verificationFoundSources).toHaveLength(5);
            expect(result.current.verificationFoundSources.map(s => s.name)).toEqual([
                EVerificationSource.Bluprynt,
                EVerificationSource.CoinGecko,
                EVerificationSource.Jupiter,
                EVerificationSource.Solflare,
                EVerificationSource.RugCheck,
            ]);
        });

        it('should exclude sources with isVerificationFound false', () => {
            vi.mocked(useBlupryntVerification).mockReturnValue({
                status: BlupryntStatus.FetchFailed,
                verified: false,
            });
            vi.mocked(useCoinGeckoVerification).mockReturnValue({
                status: CoingeckoStatus.FetchFailed,
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

            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));

            expect(result.current.verificationFoundSources).toHaveLength(1);
            expect(result.current.verificationFoundSources[0].name).toBe(EVerificationSource.Solflare);
        });
    });

    describe('sourcesToApply', () => {
        it('should include sources that are not verified, not found, and not rate limited', () => {
            vi.mocked(useBlupryntVerification).mockReturnValue({
                status: BlupryntStatus.FetchFailed,
                verified: false,
            });
            vi.mocked(useCoinGeckoVerification).mockReturnValue({
                status: CoingeckoStatus.FetchFailed,
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

            const unverifiedToken = { ...baseTokenInfo, verified: false };
            const { result } = renderHook(() => useTokenVerification(unverifiedToken));

            expect(result.current.sourcesToApply).toHaveLength(4);
            expect(result.current.sourcesToApply.map(s => s.name)).toEqual([
                EVerificationSource.Bluprynt,
                EVerificationSource.CoinGecko,
                EVerificationSource.Jupiter,
                EVerificationSource.RugCheck,
            ]);
        });

        it('should exclude rate limited sources from sourcesToApply', () => {
            vi.mocked(useBlupryntVerification).mockReturnValue({
                status: BlupryntStatus.FetchFailed,
                verified: false,
            });
            vi.mocked(useCoinGeckoVerification).mockReturnValue({
                status: CoingeckoStatus.RateLimited,
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

            const unverifiedToken = { ...baseTokenInfo, verified: false };
            const { result } = renderHook(() => useTokenVerification(unverifiedToken));

            expect(result.current.sourcesToApply).toHaveLength(1);
            expect(result.current.sourcesToApply[0].name).toBe(EVerificationSource.Bluprynt);
        });

        it('should exclude sources with verification found from sourcesToApply', () => {
            vi.mocked(useBlupryntVerification).mockReturnValue({
                status: BlupryntStatus.Success,
                verified: false,
            });
            vi.mocked(useCoinGeckoVerification).mockReturnValue({
                status: CoingeckoStatus.FetchFailed,
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

            const unverifiedToken = { ...baseTokenInfo, verified: false };
            const { result } = renderHook(() => useTokenVerification(unverifiedToken));

            expect(result.current.sourcesToApply.map(s => s.name)).not.toContain(EVerificationSource.Bluprynt);
        });

        it('should be empty when all sources are verified or found', () => {
            vi.mocked(useBlupryntVerification).mockReturnValue({
                status: BlupryntStatus.Success,
                verified: true,
            });
            vi.mocked(useCoinGeckoVerification).mockReturnValue({
                status: CoingeckoStatus.Success,
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

            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));

            expect(result.current.sourcesToApply).toHaveLength(0);
        });
    });

    describe('edge cases', () => {
        it('should handle undefined tokenInfo', () => {
            const { result } = renderHook(() => useTokenVerification(undefined));

            expect(result.current.sources).toHaveLength(5);
            expect(result.current.verificationFoundSources).toHaveLength(0);
        });

        it('should handle mixed verification states', () => {
            vi.mocked(useBlupryntVerification).mockReturnValue({
                status: BlupryntStatus.Success,
                verified: true,
            });
            vi.mocked(useCoinGeckoVerification).mockReturnValue({
                status: CoingeckoStatus.RateLimited,
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

            const { result } = renderHook(() => useTokenVerification(baseTokenInfo));

            expect(result.current.verificationFoundSources.map(s => s.name)).toEqual([
                EVerificationSource.Bluprynt,
                EVerificationSource.Jupiter,
                EVerificationSource.Solflare,
                EVerificationSource.RugCheck,
            ]);
            expect(result.current.rateLimitedSources.map(s => s.name)).toEqual([EVerificationSource.CoinGecko]);
            expect(result.current.sourcesToApply).toHaveLength(0);
        });
    });
});

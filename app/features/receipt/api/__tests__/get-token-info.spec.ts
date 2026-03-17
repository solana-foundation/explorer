import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { getTokenInfo } from '../get-token-info';

describe('getTokenInfo', () => {
    const mintAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    });

    it('should return token info on success', async () => {
        const tokenInfo = {
            logoURI: 'https://example.com/usdc.png',
            symbol: 'USDC',
        };

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValueOnce({
                json: () => Promise.resolve({ content: [tokenInfo] }),
                status: 200,
            })
        );

        const result = await getTokenInfo(mintAddress, Cluster.MainnetBeta);

        expect(result).toEqual(tokenInfo);
    });

    it('should return undefined when response has missing content', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValueOnce({
                json: () => Promise.resolve({}),
                status: 200,
            })
        );

        const result = await getTokenInfo(mintAddress, Cluster.MainnetBeta);

        expect(result).toBeUndefined();
    });
});

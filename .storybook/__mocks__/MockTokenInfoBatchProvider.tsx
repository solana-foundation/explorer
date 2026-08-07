import { getTokenInfoSwrKey } from '@utils/token-info';
import React, { useCallback } from 'react';
import { mutate } from 'swr';

import type { TokenInfo } from '@/app/entities/token-info';

import { TokenInfoBatchContext } from '../../app/entities/token-info/model/token-info-batch-provider';

type MockTokenInfoBatchProviderProps = {
    children: React.ReactNode;
    /** Optional per-mint token info keyed by base58 address. When set, a requested mint's SWR entry is seeded. */
    infos?: Record<string, Partial<TokenInfo>>;
};

/**
 * Mock provider for Storybook stories that replaces TokenInfoBatchProvider.
 *
 * Provides a no-op implementation of the token info batch context
 * without making network requests.
 *
 * @example
 * ```tsx
 * import { MockTokenInfoBatchProvider } from '../../../../../.storybook/__mocks__/MockTokenInfoBatchProvider';
 *
 * const meta = {
 *     decorators: [
 *         Story => (
 *             <MockTokenInfoBatchProvider>
 *                 <Story />
 *             </MockTokenInfoBatchProvider>
 *         ),
 *     ],
 * };
 * ```
 */
export function MockTokenInfoBatchProvider({ children, infos }: MockTokenInfoBatchProviderProps) {
    const requestTokenInfo = useCallback(
        (address: string, cluster: any, genesisHash?: string) => {
            const info = infos?.[address];
            if (info) mutate(getTokenInfoSwrKey(address, cluster, genesisHash), info, false);
        },
        [infos],
    );

    return <TokenInfoBatchContext.Provider value={requestTokenInfo}>{children}</TokenInfoBatchContext.Provider>;
}

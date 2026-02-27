import React from 'react';

import { TokenInfoBatchContext } from '../../app/entities/token-info/model/token-info-batch-provider';

type MockTokenInfoBatchProviderProps = {
    children: React.ReactNode;
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
export function MockTokenInfoBatchProvider({ children }: MockTokenInfoBatchProviderProps) {
    const noopRequestTokenInfo = () => {};

    return <TokenInfoBatchContext.Provider value={noopRequestTokenInfo}>{children}</TokenInfoBatchContext.Provider>;
}

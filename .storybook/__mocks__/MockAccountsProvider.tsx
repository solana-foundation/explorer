import { Account, DispatchContext, FetchersContext, State, StateContext } from '@providers/accounts';
import { TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import React from 'react';

import { FetchStatus } from '@/app/providers/cache';
import { MAINNET_BETA_URL } from '@/app/utils/cluster';
import { LOADER_IDS } from '@/app/utils/programs';

// BPF Loader 2 program ID - using key from LOADER_IDS
const BPF_LOADER_2_KEY = Object.keys(LOADER_IDS).find(key => LOADER_IDS[key] === 'BPF Loader 2')!;
const BPF_LOADER_2 = new PublicKey(BPF_LOADER_2_KEY);

// Mock account data for programs
const createMockProgramAccount = (pubkey: PublicKey): Account => ({
    pubkey,
    lamports: 5_542_247_638, // ~5.54 SOL
    executable: true,
    owner: BPF_LOADER_2,
    space: 36,
    data: {},
});

// Pre-populated mock entries for known programs
const mockState: State = {
    url: MAINNET_BETA_URL,
    entries: {
        [SystemProgram.programId.toBase58()]: {
            data: createMockProgramAccount(SystemProgram.programId),
            status: FetchStatus.Fetched,
        },
        [TOKEN_PROGRAM_ID.toBase58()]: {
            data: createMockProgramAccount(TOKEN_PROGRAM_ID),
            status: FetchStatus.Fetched,
        },
    },
};

// Mock fetchers that do nothing
const mockFetchers = {
    parsed: { fetch: () => {} },
    raw: { fetch: () => {} },
    skip: { fetch: () => {} },
};

type MockAccountsProviderProps = {
    children: React.ReactNode;
};

/**
 * Mock provider for Storybook stories that replaces AccountsProvider.
 *
 * Provides pre-populated account data for commonly used programs
 * (System Program, Token Program, etc.) without making network requests.
 *
 * @example
 * ```tsx
 * import { MockAccountsProvider } from '../../../../../.storybook/__mocks__/MockAccountsProvider';
 *
 * const meta = {
 *     decorators: [
 *         Story => (
 *             <ClusterProvider>
 *                 <MockAccountsProvider>
 *                     <Story />
 *                 </MockAccountsProvider>
 *             </ClusterProvider>
 *         ),
 *     ],
 * };
 * ```
 *
 * To add more mock accounts, add entries to the `mockState.entries` object.
 */
export function MockAccountsProvider({ children }: MockAccountsProviderProps) {
    return (
        <StateContext.Provider value={mockState}>
            <DispatchContext.Provider value={() => {}}>
                <FetchersContext.Provider value={mockFetchers as any}>{children}</FetchersContext.Provider>
            </DispatchContext.Provider>
        </StateContext.Provider>
    );
}

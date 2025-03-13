import { intoTransactionInstructionFromVersionedMessage } from '@components/inspector/utils';
import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { render, screen } from '@testing-library/react';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import { AddressTableLookupAddress } from '../inspector/AddressTableLookupAddress';

describe('AddressTableLookupAddress', () => {
    beforeEach(() => {
        mock.mockUseSearchParams();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should render static address', async () => {
        const index = 1;
        const m = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsg);
        const ti = intoTransactionInstructionFromVersionedMessage(m.compiledInstructions[index], m);
        expect(ti.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <AddressTableLookupAddress accountIndex={0} message={m} />
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        // check that card is rendered with proper title
        expect(screen.queryAllByText(/EzdQH5zUfTMGb3vwU4oumxjVcxKMDpJ6dB78pbjfHmmb/)).toHaveLength(2);
    });
});

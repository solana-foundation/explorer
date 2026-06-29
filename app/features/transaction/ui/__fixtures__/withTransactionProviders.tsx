import { InstructionParserProvider } from '@entities/instruction-parser';
import { ClusterProvider } from '@providers/cluster';
import { mockParsedTransactionDetails, mockTransactionStatus } from '@storybook-config/__fixtures__/transactions';
import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { MockTokenInfoBatchProvider } from '@storybook-config/__mocks__/MockTokenInfoBatchProvider';
import { MockTransactionsProvider } from '@storybook-config/__mocks__/MockTransactionsProvider';
import React from 'react';

import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';

export function withTransactionProviders(
    parsed: Record<string, ReturnType<typeof mockParsedTransactionDetails>>,
    status: Record<string, ReturnType<typeof mockTransactionStatus>>,
) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <ClusterProvider>
                <MockTokenInfoBatchProvider>
                    <MockTransactionsProvider parsed={parsed} status={status}>
                        <MockAccountsProvider>
                            <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                                {children}
                            </InstructionParserProvider>
                        </MockAccountsProvider>
                    </MockTransactionsProvider>
                </MockTokenInfoBatchProvider>
            </ClusterProvider>
        );
    };
}

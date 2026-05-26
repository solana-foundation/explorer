import { FetchStatus } from '@providers/cache';
import { DispatchContext, StateContext } from '@providers/transactions/parsed';
import type { Meta, StoryObj } from '@storybook/react';
import { MockClusterProvider as ClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { nextjsParameters } from '@storybook-config/decorators';
import React from 'react';

import { ProgramLogSection } from '../ProgramLogSection';

const SIGNATURE = '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW';

const noop = () => undefined;

// Minimal ParsedTransactionWithMeta — only fields the card reads are populated.
const mockDetails = {
    data: {
        transactionWithMeta: {
            meta: {
                err: null,
                fee: 5000,
                innerInstructions: [],
                logMessages: [
                    'Program 11111111111111111111111111111111 invoke [1]',
                    'Program 11111111111111111111111111111111 success',
                ],
            },
            transaction: {
                message: {
                    accountKeys: [],
                    instructions: [],
                    recentBlockhash: '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZAMdL4VZHirm',
                },
                signatures: [SIGNATURE],
            },
        },
    },
    status: FetchStatus.Fetched,
};

const mockState = {
    entries: { [SIGNATURE]: mockDetails },
    url: 'https://api.mainnet-beta.solana.com',
};

function MockParsedDetailsProvider({ children }: { children: React.ReactNode }) {
    return (
        <StateContext.Provider value={mockState as any}>
            <DispatchContext.Provider value={noop}>{children}</DispatchContext.Provider>
        </StateContext.Provider>
    );
}

const meta = {
    component: ProgramLogSection,
    decorators: [
        Story => (
            <ClusterProvider>
                <MockParsedDetailsProvider>
                    <Story />
                </MockParsedDetailsProvider>
            </ClusterProvider>
        ),
    ],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Transaction/ProgramLogSection',
} satisfies Meta<typeof ProgramLogSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { signature: SIGNATURE },
};

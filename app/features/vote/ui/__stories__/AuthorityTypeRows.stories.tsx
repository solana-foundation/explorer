import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCardTableField } from '@storybook-config/decorators';

import { AuthorityTypeRows } from '../instructions/AuthorityTypeRows';

const meta = {
    component: AuthorityTypeRows,
    decorators: [withCardTableField],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Features/Vote/AuthorityTypeRows',
} satisfies Meta<typeof AuthorityTypeRows>;

export default meta;
type Story = StoryObj<typeof meta>;

// Unit variants ("Voter" / "Withdrawer") serialize as a bare string and render a single row.
export const Voter: Story = {
    args: { authorityType: 'Voter' },
};

export const Withdrawer: Story = {
    args: { authorityType: 'Withdrawer' },
};

// SIMD-0387 BLS variant: bls_pubkey (48 bytes) and proof-of-possession (96 bytes) shown base64-encoded.
export const VoterWithBls: Story = {
    args: {
        authorityType: {
            VoterWithBLS: {
                bls_proof_of_possession: new Array(96).fill(7),
                bls_pubkey: new Array(48).fill(3),
            },
        },
    },
};

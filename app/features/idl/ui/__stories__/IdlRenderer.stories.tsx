import type { AnchorIdl, CodamaIdl } from '@entities/idl';
import codamaIdlMock from '@entities/idl/mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters } from '@storybook-config/decorators';

import { IdlRenderer } from '../IdlRenderer';

const meta: Meta<typeof IdlRenderer> = {
    component: IdlRenderer,
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Features/IDL/UI/IdlRenderer',
};

export default meta;
type Story = StoryObj<typeof meta>;

const PROGRAM_ID = PublicKey.default.toBase58();

// Minimal Anchor 0.30 IDL with `metadata.spec` so the formatter routes via the 0.30 path
// (the legacy fallback in convert-legacy-idl chokes on 0.30-shaped accounts/events).
const anchorIdl: AnchorIdl = {
    accounts: [{ discriminator: [216, 146, 107, 94, 104, 75, 182, 177], name: 'State' }],
    address: PROGRAM_ID,
    errors: [{ code: 6000, msg: 'The provided value is invalid.', name: 'InvalidValue' }],
    instructions: [
        {
            accounts: [
                { name: 'state', signer: true, writable: true },
                { name: 'payer', signer: true, writable: true },
                { address: '11111111111111111111111111111111', name: 'system_program' },
            ],
            args: [
                { name: 'value', type: 'u64' },
                { name: 'label', type: 'string' },
            ],
            discriminator: [175, 175, 109, 31, 13, 152, 155, 237],
            name: 'initialize',
        },
        {
            accounts: [{ name: 'state', writable: true }],
            args: [{ name: 'value', type: 'u64' }],
            discriminator: [219, 200, 88, 176, 158, 63, 253, 127],
            name: 'update',
        },
    ],
    metadata: { name: 'demo', spec: '0.1.0', version: '0.1.0' },
    types: [
        {
            name: 'State',
            type: {
                fields: [
                    { name: 'value', type: 'u64' },
                    { name: 'label', type: 'string' },
                ],
                kind: 'struct',
            },
        },
    ],
} as unknown as AnchorIdl;

export const AnchorFormatted: Story = {
    args: {
        collapsed: false,
        idl: anchorIdl,
        programId: PROGRAM_ID,
        raw: false,
        searchStr: '',
    },
};

export const CodamaFormatted: Story = {
    args: {
        collapsed: false,
        idl: codamaIdlMock as unknown as CodamaIdl,
        programId: PROGRAM_ID,
        raw: false,
        searchStr: '',
    },
};

export const RawJson: Story = {
    args: {
        collapsed: 2,
        idl: anchorIdl,
        programId: PROGRAM_ID,
        raw: true,
        searchStr: '',
    },
};

export const WithSearch: Story = {
    args: {
        collapsed: false,
        idl: anchorIdl,
        programId: PROGRAM_ID,
        raw: false,
        searchStr: 'initialize',
    },
};

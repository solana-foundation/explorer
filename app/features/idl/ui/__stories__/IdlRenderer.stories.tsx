import type { AnchorIdl, CodamaIdl } from '@entities/idl';
import anchorReferenceIdl from '@entities/idl/mocks/anchor/reference-0.30.json';
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

export const AnchorFormatted: Story = {
    args: {
        collapsed: false,
        idl: anchorReferenceIdl as unknown as AnchorIdl,
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
        idl: anchorReferenceIdl as unknown as AnchorIdl,
        programId: PROGRAM_ID,
        raw: true,
        searchStr: '',
    },
};

export const WithSearch: Story = {
    args: {
        collapsed: false,
        idl: anchorReferenceIdl as unknown as AnchorIdl,
        programId: PROGRAM_ID,
        raw: false,
        searchStr: 'initialize',
    },
};

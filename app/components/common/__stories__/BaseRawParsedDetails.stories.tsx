import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCardTableField } from '@storybook-config/decorators';

import { BaseRawParsedDetails } from '../BaseRawParsedDetails';

const sampleIx = {
    parsed: {
        info: {
            destination: '8Vw25ZackDzaJzzBBqcgcpDsCsDfRSkMGgwFQ3gbReWF',
            lamports: 1_000_000_000,
            source: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        },
        type: 'transfer',
    },
    program: 'system',
    programId: new PublicKey('11111111111111111111111111111111'),
} as any;

const meta: Meta<typeof BaseRawParsedDetails> = {
    component: BaseRawParsedDetails,
    decorators: [withCardTableField],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Common/BaseRawParsedDetails',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { ix: sampleIx },
};

export const WithChildRow: Story = {
    args: {
        children: (
            <tr>
                <td>Program</td>
                <td className="text-lg-end">System</td>
            </tr>
        ),
        ix: sampleIx,
    },
};

import { gen } from '@__fixtures__/gen';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BlockhashesCard } from '../BlockhashesCard';

const meta: Meta<typeof BlockhashesCard> = {
    component: BlockhashesCard,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/BlockhashesCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithEntries: Story = {
    args: {
        blockhashes: Array.from({ length: 4 }, (_, i) => ({
            blockhash: gen.blockhash(i),
            feeCalculator: { lamportsPerSignature: '5000' },
        })),
    },
};

export const Empty: Story = {
    args: { blockhashes: [] },
};

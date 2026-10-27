import { gen } from '@__fixtures__/gen';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import * as mockExtensions from '@/app/__tests__/mock-parsed-extensions-stubs';
import { OverviewCard } from '@/app/shared/ui/OverviewCard';
import { populatePartialParsedTokenExtension } from '@/app/utils/token-extension';

import { TokenExtensionsStatusRow } from '../TokenExtensionsStatusRow';

const meta = {
    component: TokenExtensionsStatusRow,
    decorators: [
        // Mirrors the production wrapper (AccountCard / OverviewCard) the row renders in.
        Story => (
            <OverviewCard title="Token Mint">
                <Story />
            </OverviewCard>
        ),
    ],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/token-extensions/TokenExtensionsStatusRow',
} satisfies Meta<typeof TokenExtensionsStatusRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const extension = {
    extension: mockExtensions.transferFeeConfig0.extension,
    parsed: mockExtensions.transferFeeConfig0,
    ...populatePartialParsedTokenExtension(mockExtensions.transferFeeConfig0.extension),
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
    args: {
        address: gen.address(1),
        extensions: new Array(5).fill(null).map(() => extension),
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        const badges = canvas.getAllByText('transferFeeConfig');
        expect(badges).toHaveLength(5);
    },
};

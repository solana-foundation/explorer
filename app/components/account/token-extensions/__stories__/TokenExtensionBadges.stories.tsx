import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { parsedTransferFeeConfig0 } from '@/app/__tests__/mock-parsed-extensions-stubs';

import { TokenExtensionBadges } from '../TokenExtensionBadges';

const meta = {
    component: TokenExtensionBadges,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/token-extensions/TokenExtensionBadges',
} satisfies Meta<typeof TokenExtensionBadges>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
    args: {
        extensions: new Array(5).fill(null).map(() => parsedTransferFeeConfig0),
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        const badges = canvas.getAllByText('transferFeeConfig');
        expect(badges).toHaveLength(5);
    },
};

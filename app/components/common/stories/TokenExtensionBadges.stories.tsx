import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import * as mockExtensions from '@/app/__tests__/mock-parsed-extensions-stubs';
import { populatePartialParsedTokenExtension } from '@/app/utils/token-extension';

import { TokenExtensionBadges } from '../TokenExtensionBadges';

const meta = {
    component: TokenExtensionBadges,
    tags: ['autodocs', 'test'],
    title: 'Components/Common/TokenExtensionBadges',
} satisfies Meta<typeof TokenExtensionBadges>;

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
        extensions: new Array(5).fill(null).map(() => extension),
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        const tooltipButton = canvas.getAllByRole('button');
        expect(tooltipButton).toHaveLength(5);
    },
};

import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import * as mockExtensions from '@/app/__tests__/mock-parsed-extensions-stubs';
import { populatePartialParsedTokenExtension } from '@/app/utils/token-extension';

import { TokenExtensionBadge } from '../TokenExtensionBadge';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    args: {
        onClick: fn(),
    },
    component: TokenExtensionBadge,
    tags: ['autodocs'],
    title: 'Components/Common/TokenExtensionBadge',
} satisfies Meta<typeof TokenExtensionBadge>;

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
        extension,
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        const tooltipButton = canvas.getByRole('button');
        expect(tooltipButton).toHaveAttribute('data-slot', 'tooltip-trigger');
        await userEvent.hover(tooltipButton);
    },
};

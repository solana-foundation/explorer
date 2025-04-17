import { Keypair } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';

import * as mockExtensions from '@/app/__tests__/mock-parsed-extensions-stubs';
import { populatePartialParsedTokenExtension } from '@/app/utils/token-extension';

import { TokenExtensionsStatusRow } from '../TokenExtensionsStatusRow';

const meta = {
    component: TokenExtensionsStatusRow,
    parameters: {
        nextjs: {
            appDirectory: true,
        },
    },
    tags: ['autodocs'],
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
        address: Keypair.generate().publicKey.toString(),
        extensions: new Array(5).fill(null).map(() => extension),
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        const tooltipButton = canvas.getAllByRole('button');
        expect(tooltipButton).toHaveLength(5);
    },
};

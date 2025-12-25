import { TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import { SystemProgram } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { nextjsParameters, withCardTableField } from '../../../../../.storybook/decorators';
import { ProgramField } from '../ProgramField';

const meta = {
    component: ProgramField,
    decorators: [withCardTableField],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Entities/Instruction Card/UI/Field/ProgramField',
} satisfies Meta<typeof ProgramField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        programId: SystemProgram.programId,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await expect(canvas.getByText('Program')).toBeInTheDocument();
        await expect(canvas.getByRole('link', { name: 'System Program' })).toBeInTheDocument();
    },
};

export const WithExtendedInfo: Story = {
    args: {
        programId: SystemProgram.programId,
        showExtendedInfo: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await expect(canvas.getByText('Program')).toBeInTheDocument();
        await expect(canvas.getByRole('link', { name: 'System Program' })).toBeInTheDocument();
        await expect(canvas.getByText(/Owned by BPF Loader 2/)).toBeInTheDocument();
        await expect(canvas.getByText(/Balance is 5\.542247638 SOL/)).toBeInTheDocument();
        await expect(canvas.getByText(/Size is 36 byte\(s\)/)).toBeInTheDocument();
    },
};

export const TokenProgram: Story = {
    args: {
        programId: TOKEN_PROGRAM_ID,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await expect(canvas.getByText('Program')).toBeInTheDocument();
        await expect(canvas.getByRole('link', { name: 'Token Program' })).toBeInTheDocument();
    },
};

export const TokenProgramExtended: Story = {
    args: {
        programId: TOKEN_PROGRAM_ID,
        showExtendedInfo: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await expect(canvas.getByText('Program')).toBeInTheDocument();
        await expect(canvas.getByRole('link', { name: 'Token Program' })).toBeInTheDocument();
        await expect(canvas.getByText(/Owned by BPF Loader 2/)).toBeInTheDocument();
        await expect(canvas.getByText(/Balance is 5\.542247638 SOL/)).toBeInTheDocument();
        await expect(canvas.getByText(/Size is 36 byte\(s\)/)).toBeInTheDocument();
    },
};

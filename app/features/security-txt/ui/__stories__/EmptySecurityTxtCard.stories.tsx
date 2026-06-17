import type { Meta, StoryObj } from '@storybook/react';

import { EmptySecurityTxtCard } from '../EmptySecurityTxtCard';

const meta: Meta<typeof EmptySecurityTxtCard> = {
    component: EmptySecurityTxtCard,
    tags: ['autodocs', 'test'],
    title: 'Features/SecurityTxt/EmptySecurityTxtCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
};

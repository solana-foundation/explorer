import type { Idl } from '@coral-xyz/anchor';
import idlMock from '@entities/idl/mocks/codama/whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc-idl.json';
import type { Meta, StoryObj } from '@storybook/react';

import { AnchorFormattedIdl } from '../AnchorFormattedIdl';

const meta = {
    component: AnchorFormattedIdl,
    parameters: {
        docs: {
            description: {
                story: 'Format and render Anchor IDL',
            },
        },
        nextjs: {
            appDirectory: true,
        },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/UI/AnchorFormattedIdl',
} satisfies Meta<typeof AnchorFormattedIdl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DisplayLegacyShankIdl: Story = {
    args: {
        idl: idlMock as unknown as Idl,
        programId: '6LtLpnUFNByNXLyCoK9wA2MykKAmQNZKBdY8s47dehDc',
    },
};

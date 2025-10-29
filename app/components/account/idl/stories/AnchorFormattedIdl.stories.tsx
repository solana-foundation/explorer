import type { Meta, StoryObj } from '@storybook/react';

import { AnchorFormattedIdl } from '../formatted-idl/IdlView';
import idlMock from '../mocks/whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc-idl.json';

const meta = {
    component: AnchorFormattedIdl,
    decorators: [
        Story => (
            <div>
                <Story />
            </div>
        ),
    ],
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
    title: 'Components/Account/idl/AnchorFormattedIdl',
} satisfies Meta<typeof AnchorFormattedIdl>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
    args: {
        idl: idlMock as any,
        programId: '6LtLpnUFNByNXLyCoK9wA2MykKAmQNZKBdY8s47dehDc',
    },
};

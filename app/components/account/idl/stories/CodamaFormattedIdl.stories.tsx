import type { Meta, StoryObj } from '@storybook/react';

import { CodamaFormattedIdl } from '../formatted-idl/IdlView';
import idlMock from '../mocks/codama/whirlpool@0.30.1.json';

const meta = {
    component: CodamaFormattedIdl,
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
                story: 'Format and render Codama IDL',
            },
        },
        nextjs: {
            appDirectory: true,
        },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/idl/CodamaFormattedIdl',
} satisfies Meta<typeof CodamaFormattedIdl>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
    args: {
        idl: idlMock as any,
    },
};

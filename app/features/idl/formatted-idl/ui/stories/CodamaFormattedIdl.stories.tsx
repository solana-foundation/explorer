import type { Meta, StoryObj } from '@storybook/react';
import type { RootNode } from 'codama';

import codamaIdlMock from '@/app/components/account/idl/mocks/codama/whirlpool@0.30.1.json';
import convertedFromAnchorIdlMock from '@/app/components/account/idl/mocks/codama/whirlpool@0.30.1.json';

import { CodamaFormattedIdl } from '../CodamaFormattedIdl';

const meta = {
    component: CodamaFormattedIdl,
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
    title: 'Features/IDL/Formatted IDL/UI/CodamaFormattedIdl',
} satisfies Meta<typeof CodamaFormattedIdl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DisplayCodamaIdl: Story = {
    args: {
        idl: codamaIdlMock as unknown as RootNode,
    },
};

export const DisplayConvertedAnchorIdl: Story = {
    args: {
        idl: convertedFromAnchorIdlMock as unknown as RootNode,
    },
};

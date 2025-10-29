import type { Meta, StoryObj } from '@storybook/react';

import { IdlFieldsView } from '../formatted-idl/IdlFields';

const meta = {
    component: IdlFieldsView,
    decorators: [
        Story => (
            <div>
                <Story />
            </div>
        ),
    ],
    parameters: {
        nextjs: {
            appDirectory: true,
        },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/idl/components/IdlFields',
} satisfies Meta<typeof IdlFieldsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StructFields: Story = {
    args: {
        fieldType: {
            fields: [
                { name: 'id', type: 'u64' },
                { name: 'name', type: 'string' },
                { name: 'balance', type: 'u128' },
                { docs: ['User address'], name: 'address', type: 'pubkey' },
            ],
            kind: 'struct',
        },
    },
};

export const EnumFields: Story = {
    args: {
        fieldType: {
            kind: 'enum',
            variants: ['Option1', 'Option2', 'Option3 [u64, string]', 'Option4 {"field1":"u8","field2":"bool"}'],
        },
    },
};

export const TypeField: Story = {
    args: {
        fieldType: {
            docs: ['Hello docs!'],
            kind: 'type',
            name: 'customType',
            type: 'array(u8, 32)',
        },
    },
};

export const UnknownField: Story = {
    args: {
        fieldType: {
            docs: ['Some unknown field'],
            kind: 'unknown',
            name: 'someCustomType',
            type: '{"mint":"pubkey","amount":"u64"}',
        },
    },
};

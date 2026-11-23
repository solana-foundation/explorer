import type { Meta, StoryObj } from '@storybook-config/types';
import { fn } from 'storybook/test';

import { BaseInspectorInput } from '../BaseInspectorInput';

const meta = {
    args: {
        hasValue: false,
        onClear: fn(),
        placeholder: 'Paste a raw base58/base64 encoded transaction message or Squads vault transaction account',
        rows: 3,
    },
    component: BaseInspectorInput,
    parameters: {
        docs: {
            description: {
                component: [
                    'Primary input of the Transaction Inspector page. `RawInput` owns parsing and URL sync; this component only renders the field, the inline Clear and the error line.',
                    '',
                    '## References',
                    '',
                    '- Button (`@/app/components/shared/ui/button`) — the inline Clear action',
                ].join('\n'),
            },
        },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Inspector/BaseInspectorInput',
} satisfies Meta<typeof BaseInspectorInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Filled: Story = {
    args: { defaultValue: '11111111111111111111111111111111', hasValue: true },
};

export const Invalid: Story = {
    args: {
        defaultValue: 'not-a-transaction',
        error: 'Input must be base58/base64 encoded or a valid account address',
        hasValue: true,
    },
};

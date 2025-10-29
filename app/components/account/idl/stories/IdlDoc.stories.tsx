import type { Meta, StoryObj } from '@storybook/react';

import { IdlDoc, IdlDocTooltip } from '../formatted-idl/IdlDoc';

const meta = {
    component: IdlDoc,
    decorators: [
        Story => (
            <div>
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/idl/components/IdlDoc',
} satisfies Meta<typeof IdlDoc>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleLineDoc: Story = {
    args: {
        docs: ['This is a simple documentation line.'],
    },
};

export const MultiLineDoc: Story = {
    args: {
        docs: [
            'This is the first line of documentation.',
            'This is the second line.',
            'And this is the third line with more detailed explanation.',
        ],
    },
};

export const LongDocumentation: Story = {
    args: {
        docs: [
            'This is a much longer documentation that explains a complex component or instruction in great detail.',
            'It contains multiple paragraphs to properly document all the functionality.',
            'Parameters need to be carefully set according to the program requirements.',
            'See the technical specification for more details on implementation.',
        ],
    },
};

// Create a separate meta for IdlDocTooltip
const tooltipMeta = {
    component: IdlDocTooltip,
    decorators: [
        Story => (
            <div className="p-10 flex items-center justify-center">
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/idl/components/IdlDocTooltip',
} satisfies Meta<typeof IdlDocTooltip>;

export const Tooltip: StoryObj<typeof tooltipMeta> = {
    args: {
        children: <span className="badge bg-success-soft">Hover over me</span>,
        docs: ['This documentation appears in a tooltip when hovering.'],
    },
    render: args => <IdlDocTooltip {...args} />,
};

export const TooltipWithoutDocs: StoryObj<typeof tooltipMeta> = {
    args: {
        children: <span className="badge bg-warning-soft">No tooltip on hover</span>,
        docs: [],
    },
    render: args => <IdlDocTooltip {...args} />,
};

export const TooltipWithMultilineDoc: StoryObj<typeof tooltipMeta> = {
    args: {
        children: <span className="badge bg-info-soft">Hover for detailed docs</span>,
        docs: ['First line of documentation.', 'Second line with more details.', 'Third line explaining edge cases.'],
    },
    render: args => <IdlDocTooltip {...args} />,
};

export const NoDocumentation: Story = {
    args: {
        docs: [],
    },
};

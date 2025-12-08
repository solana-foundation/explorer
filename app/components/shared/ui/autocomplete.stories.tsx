import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Autocomplete, type Value } from './autocomplete';

const meta: Meta<typeof Autocomplete> = {
    argTypes: {
        emptyMessage: {
            control: 'text',
        },
        loading: {
            control: 'boolean',
        },
    },
    component: Autocomplete,
    decorators: [
        Story => (
            <div className="e-w-96">
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: 'centered',
    },
    title: 'Components/Shared/UI/Autocomplete',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => {
        const DefaultStory = () => {
            const [value, setValue] = useState<Value>('');
            const [inputId, setInputId] = useState<string>('');
            return (
                <Layout
                    value={value}
                    label="Simple Items"
                    description="This example demonstrates a basic autocomplete component with a list of items. You can type in the input to see the autocomplete dropdown."
                    inputId={inputId}
                >
                    <Autocomplete
                        items={getSimpleItems()}
                        inputProps={{ placeholder: 'Simple items...' }}
                        onInputIdReady={setInputId}
                        onChange={setValue}
                        value={value}
                    />
                </Layout>
            );
        };

        return <DefaultStory />;
    },
};

export const GroupedItems: Story = {
    render: () => {
        const GroupedItemsStory = () => {
            const [value, setValue] = useState<Value>('');
            const [inputId, setInputId] = useState<string>('');
            return (
                <Layout
                    value={value}
                    label="Grouped Items"
                    description="This example demonstrates grouped items with multiple categories. Items are organized into groups with clear headings, and ungrouped items appear at the top."
                    inputId={inputId}
                >
                    <Autocomplete
                        items={getMixedtems()}
                        inputProps={{ placeholder: 'Grouped items...' }}
                        onInputIdReady={setInputId}
                        onChange={setValue}
                        value={value}
                    />
                </Layout>
            );
        };

        return <GroupedItemsStory />;
    },
};

export const Loading: Story = {
    render: () => {
        const LoadingStory = () => {
            const [value, setValue] = useState<Value>('');
            const [inputId, setInputId] = useState<string>('');
            return (
                <Layout
                    value={value}
                    label="Loading State"
                    description="This example shows the loading state of the autocomplete component. The loading indicator appears when data is being fetched. Click on the input to see the loading state in the dropdown."
                    inputId={inputId}
                >
                    <Autocomplete
                        items={getMixedtems()}
                        inputProps={{ placeholder: 'Loading options...' }}
                        loading={true}
                        onInputIdReady={setInputId}
                        onChange={setValue}
                        value={value}
                    />
                </Layout>
            );
        };

        return <LoadingStory />;
    },
};

export const Empty: Story = {
    render: () => {
        const EmptyStory = () => {
            const [value, setValue] = useState<Value>('');
            const [inputId, setInputId] = useState<string>('');
            return (
                <Layout
                    value={value}
                    label="Empty State"
                    description="This example shows the empty state when there are no items to display. The empty message is shown in the dropdown. You can still type custom values."
                    inputId={inputId}
                >
                    <Autocomplete
                        emptyMessage="No items found. Try a different search term."
                        inputProps={{ placeholder: 'Empty items...' }}
                        items={[]}
                        onInputIdReady={setInputId}
                        onChange={setValue}
                        value={value}
                    />
                </Layout>
            );
        };

        return <EmptyStory />;
    },
};

function Layout({
    children,
    value,
    label,
    description,
    inputId,
}: {
    children: React.ReactNode;
    value: Value;
    label: string;
    description: string;
    inputId: string;
}) {
    return (
        <div className="e-space-y-4">
            <div className="e-text-sm e-text-neutral-400">
                <p className="e-mb-2">
                    Value: <span className="e-font-mono e-text-white">{value || '(empty)'}</span>
                </p>
            </div>
            <div className="e-flex e-flex-col e-gap-2">
                <label htmlFor={inputId} className="e-text-sm e-font-medium e-text-white">
                    {label}
                </label>
                {children}
            </div>
            <div className="e-text-sm e-text-neutral-400">
                <p className="e-mb-2">{description}</p>
            </div>
        </div>
    );
}

function getSimpleItems() {
    return [
        { keywords: ['wallet'], label: 'Your wallet', value: 'GoctE2EU5jZqbWg2Ffo5sjCqjrnzW1m76JmWwd84pwtV' },
        { label: 'Address Lookup Table Program', value: 'AddressLookupTab1e1111111111111111111111111' },
        { label: 'Compute Budget Program', value: 'ComputeBudget111111111111111111111111111111' },
        { label: 'Config Program', value: 'Config1111111111111111111111111111111111111' },
    ];
}

function getMixedtems() {
    return [
        { label: 'Other', value: 'other' },
        { keywords: ['wallet'], label: 'Your wallet', value: 'GoctE2EU5jZqbWg2Ffo5sjCqjrnzW1m76JmWwd84pwtV' },
        { group: 'Program', keywords: ['system'], label: 'System Program', value: '11111111111111111111111111111111' },
        {
            group: 'Program',
            label: 'Address Lookup Table Program',
            value: 'AddressLookupTab1e1111111111111111111111111',
        },
        { group: 'Program', label: 'Compute Budget Program', value: 'ComputeBudget111111111111111111111111111111' },
        { group: 'Program', label: 'Config Program', value: 'Config1111111111111111111111111111111111111' },
        { group: 'Sysvar', label: 'Clock', value: 'SysvarC1ock11111111111111111111111111111111' },
    ];
}

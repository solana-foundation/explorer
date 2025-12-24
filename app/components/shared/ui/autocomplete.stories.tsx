import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Code, Database, Settings, Star } from 'react-feather';

import { Autocomplete, type AutocompleteItem, type Value } from './autocomplete';

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

export const CustomLabel: Story = {
    render: () => {
        const CustomLabelStory = () => {
            const [value, setValue] = useState<Value>('');
            const [inputId, setInputId] = useState<string>('');

            const renderItemLabel = (option: AutocompleteItem) => {
                return (
                    <span className="e-flex e-hidden e-items-center e-gap-2 md:e-flex">
                        {option.label}
                        {option.value === 'other' && <Star className="e-h-3 e-w-3 e-text-heavy-metal-100" />}
                    </span>
                );
            };

            return (
                <Layout
                    value={value}
                    label="Custom Label with Icon"
                    description="This example demonstrates custom labels with react-feather icons. Each item displays an icon next to its label based on the item type. Icons help visually distinguish different item categories."
                    inputId={inputId}
                >
                    <Autocomplete
                        items={getMixedtems()}
                        inputProps={{ placeholder: 'Search with icons...' }}
                        renderItemLabel={renderItemLabel}
                        onInputIdReady={setInputId}
                        onChange={setValue}
                        value={value}
                    />
                </Layout>
            );
        };

        return <CustomLabelStory />;
    },
};

export const CustomContent: Story = {
    render: () => {
        const CustomContentStory = () => {
            const [value, setValue] = useState<Value>('');
            const [inputId, setInputId] = useState<string>('');

            const getIcon = (option: AutocompleteItem) => {
                if (option.group === 'Program') {
                    return <Code className="e-h-4 e-w-4 e-text-blue-400" />;
                }
                if (option.group === 'Sysvar') {
                    return <Database className="e-h-4 e-w-4 e-text-purple-400" />;
                }
                if (option.value === 'other') {
                    return <Star className="e-h-4 e-w-4 e-text-yellow-400" />;
                }
                return <Settings className="e-h-4 e-w-4 e-text-green-400" />;
            };

            const renderItemContent = (option: AutocompleteItem) => {
                const isProgram = option.group === 'Program';
                const isSysvar = option.group === 'Sysvar';
                const isFeatured = option.value === 'other' || option.keywords?.includes('wallet');

                return (
                    <div className="e-flex e-w-full e-items-center e-gap-3 e-px-4 e-py-2">
                        <div className="e-flex e-shrink-0 e-items-center e-justify-center">{getIcon(option)}</div>
                        <div className="e-flex e-min-w-0 e-flex-1 e-flex-col e-gap-1">
                            <div className="e-flex e-items-center e-gap-2">
                                <span className="e-text-xs e-font-medium e-text-white">{option.label}</span>
                                {isFeatured && (
                                    <span className="e-rounded e-bg-yellow-500/20 e-px-1.5 e-py-0.5 e-text-[10px] e-font-semibold e-text-yellow-400">
                                        Featured
                                    </span>
                                )}
                            </div>
                            <div className="e-flex e-items-center e-gap-2">
                                <span className="e-font-mono e-text-[10px] e-text-heavy-metal-400">
                                    {option.value.slice(0, 20)}...
                                </span>
                                {isProgram && (
                                    <span className="e-rounded e-bg-blue-500/20 e-px-1.5 e-py-0.5 e-text-[10px] e-font-medium e-text-blue-400">
                                        Program
                                    </span>
                                )}
                                {isSysvar && (
                                    <span className="e-rounded e-bg-purple-500/20 e-px-1.5 e-py-0.5 e-text-[10px] e-font-medium e-text-purple-400">
                                        Sysvar
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            };

            return (
                <Layout
                    value={value}
                    label="Custom Content Render"
                    description="This example demonstrates fully custom content rendering using renderItemContent. Each item displays an icon, label, badges, and a truncated value with custom styling. This allows complete control over the item layout and appearance."
                    inputId={inputId}
                >
                    <Autocomplete
                        items={getMixedtems()}
                        inputProps={{ placeholder: 'Search with custom content...' }}
                        renderItemContent={renderItemContent}
                        onInputIdReady={setInputId}
                        onChange={setValue}
                        value={value}
                    />
                </Layout>
            );
        };

        return <CustomContentStory />;
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

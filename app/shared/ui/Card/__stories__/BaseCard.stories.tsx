import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseTable } from '@/app/shared/ui/Table';

import {
    BaseCard,
    BaseCardBody,
    BaseCardDescription,
    BaseCardFooter,
    BaseCardHeader,
    BaseCardTitle,
} from '../BaseCard';

const meta: Meta<typeof BaseCard> = {
    component: BaseCard,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/Card/BaseCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DashkitDefault: Story = {
    args: { ui: 'dashkit' },
    render: args => (
        <BaseCard {...args}>
            <BaseCardBody>
                <p className="m-0">Plain dashkit card with a single body.</p>
            </BaseCardBody>
        </BaseCard>
    ),
};

export const DashkitHeaderBodyFooter: Story = {
    args: { ui: 'dashkit' },
    render: args => (
        <BaseCard {...args}>
            <BaseCardHeader>
                <BaseCardTitle>Account overview</BaseCardTitle>
            </BaseCardHeader>
            <BaseCardBody>
                <p className="m-0">Body content sits between the header and the footer.</p>
            </BaseCardBody>
            <BaseCardFooter>
                <span className="text-dk-sm text-dk-gray-600">Updated just now</span>
            </BaseCardFooter>
        </BaseCard>
    ),
};

export const DashkitFlexGrow: Story = {
    args: { flex: 'grow', ui: 'dashkit' },
    render: args => (
        <div className="flex h-[260px] gap-4">
            <BaseCard {...args}>
                <BaseCardBody>
                    <p className="m-0">Left — flex: grow fills the row.</p>
                </BaseCardBody>
            </BaseCard>
            <BaseCard {...args}>
                <BaseCardBody>
                    <p className="m-0">Right — flex: grow fills the row.</p>
                </BaseCardBody>
            </BaseCard>
        </div>
    ),
};

export const DashkitBodyWithoutPadding: Story = {
    args: { ui: 'dashkit' },
    render: args => (
        <BaseCard {...args}>
            <BaseCardHeader>
                <BaseCardTitle>Tabular content</BaseCardTitle>
            </BaseCardHeader>
            <BaseCardBody className="p-0">
                <BaseTable ui="dashkit" variant="card">
                    <BaseTable.Head>
                        <BaseTable.Row>
                            <BaseTable.HeaderCell className="px-dk-4 py-2 text-left">Label</BaseTable.HeaderCell>
                            <BaseTable.HeaderCell className="px-dk-4 py-2 text-right">Value</BaseTable.HeaderCell>
                        </BaseTable.Row>
                    </BaseTable.Head>
                    <BaseTable.Body>
                        <BaseTable.Row>
                            <BaseTable.Cell className="px-dk-4 py-2">Slot</BaseTable.Cell>
                            <BaseTable.Cell className="px-dk-4 py-2 text-right">123,456</BaseTable.Cell>
                        </BaseTable.Row>
                        <BaseTable.Row>
                            <BaseTable.Cell className="px-dk-4 py-2">Epoch</BaseTable.Cell>
                            <BaseTable.Cell className="px-dk-4 py-2 text-right">789</BaseTable.Cell>
                        </BaseTable.Row>
                    </BaseTable.Body>
                </BaseTable>
            </BaseCardBody>
        </BaseCard>
    ),
};

export const TwDefault: Story = {
    args: { ui: 'tw', variant: 'default' },
    render: args => (
        <BaseCard {...args}>
            <BaseCardTitle>Card Title</BaseCardTitle>
            <BaseCardDescription>OKLCH/Tailwind-styled card; same component, different lineage.</BaseCardDescription>
        </BaseCard>
    ),
};

export const TwComplete: Story = {
    args: { ui: 'tw', variant: 'default' },
    render: args => (
        <BaseCard {...args} className="w-full max-w-md">
            <BaseCardHeader>
                <BaseCardTitle>Complete Card</BaseCardTitle>
                <BaseCardDescription>Header + Body + Footer in the tw lineage.</BaseCardDescription>
            </BaseCardHeader>
            <BaseCardBody>
                <p className="mb-4">Switch the `ui` arg to `dashkit` to see the dashkit-faithful render.</p>
            </BaseCardBody>
            <BaseCardFooter>
                <button className="rounded bg-neutral-800 px-3 py-1 text-white">Action</button>
            </BaseCardFooter>
        </BaseCard>
    ),
};

export const TwNarrow: Story = {
    args: { ui: 'tw', variant: 'narrow' },
    render: args => (
        <BaseCard {...args}>
            <p className="m-0">narrow — compact card-level padding (px-3 py-2).</p>
        </BaseCard>
    ),
};

export const TwTight: Story = {
    args: { ui: 'tw', variant: 'tight' },
    render: args => (
        <BaseCard {...args}>
            <p className="m-0">tight — no card-level padding; content owns its spacing.</p>
        </BaseCard>
    ),
};

// marginBottom overrides the implicit mb-6 that ui="dashkit" ships with
export const DashkitMarginBottom: Story = {
    render: () => (
        <div>
            <BaseCard ui="dashkit" marginBottom="none">
                <BaseCardBody ui="dashkit">
                    <p className="m-0">marginBottom=&quot;none&quot; — no gap below this card.</p>
                </BaseCardBody>
            </BaseCard>
            <BaseCard ui="dashkit" marginBottom="sm">
                <BaseCardBody ui="dashkit">
                    <p className="m-0">marginBottom=&quot;sm&quot; — small gap below this card.</p>
                </BaseCardBody>
            </BaseCard>
            <BaseCard ui="dashkit">
                <BaseCardBody ui="dashkit">
                    <p className="m-0">default — dashkit&apos;s implicit mb-6.</p>
                </BaseCardBody>
            </BaseCard>
        </div>
    ),
};

// Each `as` level maps to its dashkit font-size token (text-dk-h1..h6; div/span alias h4)
export const DashkitTitleHeadingSizes: Story = {
    render: () => (
        <BaseCard ui="dashkit">
            <BaseCardBody ui="dashkit" className="flex flex-col gap-3">
                {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span'] as const).map(as => (
                    <BaseCardTitle key={as} ui="dashkit" as={as}>
                        Title as {as}
                    </BaseCardTitle>
                ))}
            </BaseCardBody>
        </BaseCard>
    ),
};

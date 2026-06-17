import type { Meta, StoryObj } from '@storybook-config/types';
import { expect } from 'storybook/test';

import { BaseTable } from '@/app/shared/ui/Table';

import {
    ImageSliderSkeleton,
    RichListSkeleton,
    RichRowSkeleton,
    SimpleCardSkeleton,
    StatsTableSkeleton,
    TableCardSkeleton,
    TableRowSkeleton,
} from '../Skeletons';

const hasPulse = (canvasElement: HTMLElement) =>
    expect(canvasElement.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

function TableWrapper({ children }: { children: React.ReactNode }) {
    return (
        <BaseTable ui="dashkit" variant="card" nowrap>
            <BaseTable.Body>{children}</BaseTable.Body>
        </BaseTable>
    );
}

const meta = {
    component: TableRowSkeleton,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/Skeletons',
} satisfies Meta<typeof TableRowSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TableRow: Story = {
    play: async ({ canvasElement }) => {
        await hasPulse(canvasElement);
    },
    render: args => (
        <TableWrapper>
            <TableRowSkeleton {...args} />
            <TableRowSkeleton {...args} />
            <TableRowSkeleton {...args} />
        </TableWrapper>
    ),
};

export const RichRow: StoryObj<typeof RichRowSkeleton> = {
    play: async ({ canvasElement }) => {
        await hasPulse(canvasElement);
    },
    render: () => (
        <TableWrapper>
            <RichRowSkeleton />
            <RichRowSkeleton />
            <RichRowSkeleton />
        </TableWrapper>
    ),
};

export const SimpleCard: StoryObj<typeof SimpleCardSkeleton> = {
    play: async ({ canvasElement }) => {
        await hasPulse(canvasElement);
    },
    render: () => <SimpleCardSkeleton />,
};

export const SimpleCardWithTitle: StoryObj<typeof SimpleCardSkeleton> = {
    name: 'SimpleCard / with title',
    play: async ({ canvasElement }) => {
        await hasPulse(canvasElement);
    },
    render: () => <SimpleCardSkeleton withTitle />,
};

export const RichList: StoryObj<typeof RichListSkeleton> = {
    play: async ({ canvasElement }) => {
        await hasPulse(canvasElement);
    },
    render: () => <RichListSkeleton />,
};

export const StatsTable: StoryObj<typeof StatsTableSkeleton> = {
    play: async ({ canvasElement }) => {
        await hasPulse(canvasElement);
    },
    render: () => <StatsTableSkeleton />,
};

export const TableCardCustom: StoryObj<typeof TableCardSkeleton> = {
    name: 'TableCard',
    play: async ({ canvasElement }) => {
        await hasPulse(canvasElement);
    },
    render: () => <TableCardSkeleton />,
};

export const ImageSlider: StoryObj<typeof ImageSliderSkeleton> = {
    play: async ({ canvasElement }) => {
        await hasPulse(canvasElement);
    },
    render: () => <ImageSliderSkeleton />,
};

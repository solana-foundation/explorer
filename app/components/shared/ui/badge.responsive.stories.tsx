import type { Meta, StoryObj } from '@storybook/react';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { BaseTable } from '@/app/shared/ui/Table';

import { Badge } from './badge';

// Shows how dashkit badges wrap and float at different viewports. Mirrors the real usage:
// in-table status pills, inline meta tags next to addresses, header pills, and dense inline groups.
const meta = {
    component: Badge,
    decorators: [withViewportFromGlobal],
    parameters: {
        docs: { story: { height: INITIAL_VIEWPORTS.iphonex.styles.height } },
        layout: 'padded',
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/UI/Badge/Responsive',
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

const TableRow = () => (
    <div className="e-rounded-dk e-border e-border-solid e-border-dk-card-outline-dark e-bg-dk-gray-800-dark e-p-3">
        <h3 className="e-mb-2 e-text-dk-sm e-text-dk-gray-700">In-table status (parent 13px → badge ≈10px)</h3>
        <BaseTable ui="dashkit" variant="card" nowrap>
            <BaseTable.Head>
                <BaseTable.Row>
                    <BaseTable.HeaderCell>Slot</BaseTable.HeaderCell>
                    <BaseTable.HeaderCell>Result</BaseTable.HeaderCell>
                </BaseTable.Row>
            </BaseTable.Head>
            <BaseTable.Body>
                <BaseTable.Row>
                    <BaseTable.Cell>123456789</BaseTable.Cell>
                    <BaseTable.Cell>
                        <Badge ui="dashkit" variant="success">
                            Success
                        </Badge>
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>123456790</BaseTable.Cell>
                    <BaseTable.Cell>
                        <Badge ui="dashkit" variant="warning">
                            Failed
                        </Badge>
                    </BaseTable.Cell>
                </BaseTable.Row>
            </BaseTable.Body>
        </BaseTable>
    </div>
);

const InlineMetaRow = () => (
    <div className="e-rounded-dk e-border e-border-solid e-border-dk-card-outline-dark e-bg-dk-gray-800-dark e-p-3">
        <h3 className="e-mb-2 e-text-dk-sm e-text-dk-gray-700">Inline meta tags (wrap)</h3>
        <div className="e-flex e-flex-col e-gap-2">
            <div>
                Account #1
                <span className="e-ml-1.5">
                    <Badge ui="dashkit" variant="info" className="e-mr-[3px]">
                        Fee Payer
                    </Badge>
                    <Badge ui="dashkit" variant="info" className="e-mr-[3px]">
                        Signer
                    </Badge>
                    <Badge ui="dashkit" variant="destructive" className="e-mr-[3px]">
                        Writable
                    </Badge>
                    <Badge ui="dashkit" variant="warning" className="e-mr-[3px]">
                        Program
                    </Badge>
                    <Badge ui="dashkit" variant="gray">
                        Address Table Lookup
                    </Badge>
                </span>
            </div>
        </div>
    </div>
);

const HeaderPillsRow = () => (
    <div className="e-rounded-dk e-border e-border-solid e-border-dk-card-outline-dark e-bg-dk-gray-800-dark e-p-3">
        <h3 className="e-mb-2 e-text-dk-sm e-text-dk-gray-700">Header pills (solid, e.g. NFT metadata)</h3>
        <div className="e-flex e-flex-wrap e-gap-1.5">
            <Badge ui="dashkit" variant="dark" tone="solid">
                Compressed
            </Badge>
            <Badge ui="dashkit" variant="dark" tone="solid">
                Mutable
            </Badge>
            <Badge ui="dashkit" variant="dark" tone="solid">
                Master Edition
            </Badge>
            <Badge ui="dashkit" variant="dark" tone="solid">
                Verified Collection
            </Badge>
            <Badge ui="dashkit" variant="dark" tone="solid">
                Primary Market
            </Badge>
        </div>
    </div>
);

const StatusToggleRow = () => (
    <div className="e-rounded-dk e-border e-border-solid e-border-dk-card-outline-dark e-bg-dk-gray-800-dark e-p-3">
        <h3 className="e-mb-2 e-text-dk-sm e-text-dk-gray-700">Feature activation status (solid)</h3>
        <div className="e-flex e-flex-wrap e-gap-1.5">
            <Badge ui="dashkit" variant="success" tone="solid">
                Active on mainnet-beta
            </Badge>
            <Badge ui="dashkit" variant="warning" tone="solid">
                Pending activation on testnet
            </Badge>
        </div>
    </div>
);

const TitleBadgeRow = () => (
    <div className="e-rounded-dk e-border e-border-solid e-border-dk-card-outline-dark e-bg-dk-gray-800-dark e-p-3">
        <h3 className="e-mb-2 e-text-dk-sm e-text-dk-gray-700">Title with leading index badge (truncation)</h3>
        <div className="e-flex e-min-w-0 e-items-center">
            <Badge ui="dashkit" variant="info" className="e-mr-1.5 e-flex-none">
                #3
            </Badge>
            <span className="e-min-w-0 e-flex-1 e-overflow-hidden e-text-ellipsis e-whitespace-nowrap">
                Some Very Long Program Name That Will Truncate On Mobile Layouts
            </span>
            <span className="e-ml-1.5 e-flex-none">Instruction</span>
        </div>
    </div>
);

const Showcase = () => (
    <div className="e-flex e-flex-col e-gap-3">
        <TableRow />
        <InlineMetaRow />
        <HeaderPillsRow />
        <StatusToggleRow />
        <TitleBadgeRow />
    </div>
);

export const Mobile: Story = {
    globals: { viewport: { value: 'iphonex' } },
    render: () => <Showcase />,
};

export const TabletPortrait: Story = {
    globals: { viewport: { value: 'ipad' } },
    render: () => <Showcase />,
};

export const TabletLandscape: Story = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
    render: () => <Showcase />,
};

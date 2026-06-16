import type { Meta, StoryObj } from '@storybook/react';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import { ChevronDown, Download, RefreshCw, X } from 'react-feather';

import { Button } from './button';

// Shows how dashkit buttons wrap and float against each other at different viewports.
// Mirrors the real usage patterns (card-header toolbars, "Load More" footers, dropdown triggers).
const meta = {
    component: Button,
    decorators: [withViewportFromGlobal],
    parameters: {
        docs: { story: { height: INITIAL_VIEWPORTS.iphonex.styles.height } },
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/UI/Button/Responsive',
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const ToolbarRow = () => (
    <div className="e-rounded-dk e-border e-border-solid e-border-dk-card-outline-dark e-bg-dk-gray-800-dark e-p-3">
        <h3 className="e-mb-2 e-text-dk-sm e-text-dk-gray-700">Card-header toolbar</h3>
        <div className="e-flex e-flex-wrap e-items-center e-gap-1.5">
            <span className="e-mr-auto e-text-dk-h4 e-font-medium">Program Account</span>
            <Button ui="dashkit" variant="white" size="sm">
                <RefreshCw className="e-mr-1.5 e-align-text-top" size={13} /> Refresh
            </Button>
            <Button ui="dashkit" variant="white" size="sm">
                <Download className="e-mr-1.5" size={13} /> Download
            </Button>
            <Button ui="dashkit" variant="outline-danger" size="sm">
                <X className="e-mr-1.5" size={13} /> Remove
            </Button>
        </div>
    </div>
);

const ToggleRow = () => (
    <div className="e-rounded-dk e-border e-border-solid e-border-dk-card-outline-dark e-bg-dk-gray-800-dark e-p-3">
        <h3 className="e-mb-2 e-text-dk-sm e-text-dk-gray-700">Toggle group</h3>
        <div className="e-flex e-flex-wrap e-gap-1.5">
            <Button ui="dashkit" variant="black" active size="sm">
                30m
            </Button>
            <Button ui="dashkit" variant="white" size="sm">
                2h
            </Button>
            <Button ui="dashkit" variant="white" size="sm">
                6h
            </Button>
            <Button ui="dashkit" variant="white" size="sm">
                24h
            </Button>
        </div>
    </div>
);

const FooterRow = () => (
    <div className="e-rounded-dk e-border e-border-solid e-border-dk-card-outline-dark e-bg-dk-gray-800-dark e-p-3">
        <h3 className="e-mb-2 e-text-dk-sm e-text-dk-gray-700">Footer (full-width Load More)</h3>
        <Button ui="dashkit" variant="primary" className="e-w-full">
            Load More
        </Button>
    </div>
);

const DropdownTriggerRow = () => (
    <div className="e-rounded-dk e-border e-border-solid e-border-dk-card-outline-dark e-bg-dk-gray-800-dark e-p-3">
        <h3 className="e-mb-2 e-text-dk-sm e-text-dk-gray-700">Dropdown triggers</h3>
        <div className="e-flex e-flex-wrap e-gap-1.5">
            <Button ui="dashkit" variant="dark" size="sm" className="e-w-[150px]">
                Creators <ChevronDown size={15} className="e-align-text-top" />
            </Button>
            <Button ui="dashkit" variant="white" size="sm">
                Filter: All <ChevronDown className="e-align-text-top" size={13} />
            </Button>
        </div>
    </div>
);

const ModalFooterRow = () => (
    <div className="e-rounded-dk e-border e-border-solid e-border-dk-card-outline-dark e-bg-dk-gray-800-dark e-p-3">
        <h3 className="e-mb-2 e-text-dk-sm e-text-dk-gray-700">Modal-style action row</h3>
        <div className="e-flex e-justify-between e-gap-1.5">
            <Button ui="dashkit" variant="outline-danger" size="sm">
                Remove
            </Button>
            <div className="e-flex e-gap-1.5">
                <Button ui="dashkit" variant="secondary" size="sm">
                    Cancel
                </Button>
                <Button ui="dashkit" variant="primary" size="sm">
                    Save
                </Button>
            </div>
        </div>
    </div>
);

const Showcase = () => (
    <div className="e-flex e-flex-col e-gap-3">
        <ToolbarRow />
        <ToggleRow />
        <DropdownTriggerRow />
        <FooterRow />
        <ModalFooterRow />
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

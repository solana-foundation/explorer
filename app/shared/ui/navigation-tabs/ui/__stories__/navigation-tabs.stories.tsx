import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { type NavigationTab } from '@/app/shared/ui/navigation-tabs/model/types';
import { BaseNavigationTabs } from '@/app/shared/ui/navigation-tabs/ui/BaseNavigationTabs';
import { NavigationTabLink } from '@/app/shared/ui/navigation-tabs/ui/NavigationTabLink';

const BLOCK_TABS: NavigationTab[] = [
    { path: '', title: 'Transactions' },
    { path: 'rewards', title: 'Rewards' },
    { path: 'programs', title: 'Programs' },
    { path: 'accounts', title: 'Accounts' },
];

const ADDRESS_TABS: NavigationTab[] = [
    { path: '', title: 'History' },
    { path: 'transfers', title: 'Transfers' },
    { path: 'instructions', title: 'Instructions' },
    { path: 'tokens', title: 'Tokens' },
    { path: 'domains', title: 'Domains' },
    { path: 'security', title: 'Security' },
    { path: 'verified-build', title: 'Verified Build' },
    { path: 'idl', title: 'Program IDL' },
];

const meta: Meta<typeof BaseNavigationTabs> = {
    args: {
        buildHref: (path: string) => `#${path}`,
    },
    component: BaseNavigationTabs,
    title: 'Components/Shared/UI/NavigationTabs',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        activeValue: '',
        tabs: BLOCK_TABS,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // In JSDOM all offsetWidths are 0, so visibleCount = allTabs.length (all fit)
        const tablist = canvas.getByRole('tablist', { hidden: true });
        const tabs = within(tablist).getAllByRole('tab', { hidden: true });
        expect(tabs).toHaveLength(4);
        expect(tabs[0]).toHaveTextContent('Transactions');
        expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
        expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    },
};

export const ManyTabs: Story = {
    args: {
        activeValue: 'transfers',
        tabs: ADDRESS_TABS,
    },
};

// Resize the Storybook canvas narrower to see overflow tabs collapse into "More ▼"
export const MobileView: Story = {
    args: {
        activeValue: '',
        tabs: ADDRESS_TABS,
    },
    parameters: {
        globals: {
            viewport: { isRotated: false, value: 'mobile1' },
        },
    },
};

export const WithChildren: Story = {
    args: {
        activeValue: '',
        tabs: BLOCK_TABS,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // In JSDOM all offsetWidths are 0, so all tabs (static + async) are visible
        const tablist = canvas.getByRole('tablist', { hidden: true });
        const tabs = within(tablist).getAllByRole('tab', { hidden: true });
        expect(tabs).toHaveLength(6);
        expect(tabs[4]).toHaveTextContent('Async Tab 1');
        expect(tabs[5]).toHaveTextContent('Async Tab 2');
    },
    render: args => (
        <BaseNavigationTabs {...args}>
            <NavigationTabLink path="extra-1" title="Async Tab 1" />
            <NavigationTabLink path="extra-2" title="Async Tab 2" />
        </BaseNavigationTabs>
    ),
};

export const OverlappingAsyncTabs: Story = {
    args: {
        activeValue: '',
        tabs: BLOCK_TABS,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const tablist = canvas.getByRole('tablist', { hidden: true });
        const tabs = within(tablist).getAllByRole('tab', { hidden: true });

        // 4 static + 1 new ("rewards" overlaps and is deduplicated)
        expect(tabs).toHaveLength(5);
    },
    render: args => (
        <BaseNavigationTabs {...args}>
            {/* "rewards" overlaps with static tab, "extra" is new */}
            <NavigationTabLink path="rewards" title="Rewards" />
            <NavigationTabLink path="extra" title="Extra Tab" />
        </BaseNavigationTabs>
    ),
};

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { MINIMAL_VIEWPORTS } from 'storybook/viewport';

import { type NavigationTab } from '@/app/shared/ui/navigation-tabs/model/types';
import { BaseNavigationTabs } from '@/app/shared/ui/navigation-tabs/ui/BaseNavigationTabs';
import { NavigationTabLink } from '@/app/shared/ui/navigation-tabs/ui/NavigationTabLink';

function withViewport(key: keyof typeof MINIMAL_VIEWPORTS): Pick<StoryObj, 'decorators' | 'globals'> {
    const viewport = MINIMAL_VIEWPORTS[key];
    return {
        decorators: [
            Story => (
                <div style={{ width: viewport.styles.width }}>
                    <Story />
                </div>
            ),
        ],
        globals: {
            viewport: { value: key },
        },
    };
}

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
    globals: { viewport: { value: 'responsive' } },
    tags: ['autodocs'],
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

export const MobileView: Story = {
    ...withViewport('mobile1'),
    args: {
        activeValue: '',
        tabs: ADDRESS_TABS,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const tablist = canvas.getByRole('tablist', { hidden: true });
        const visibleTabs = within(tablist).getAllByRole('tab', { hidden: true });
        expect(visibleTabs.length).toBeGreaterThan(0);
        expect(visibleTabs.length).toBeLessThan(ADDRESS_TABS.length);

        const moreButton = await canvas.findByText('More', { exact: false });
        expect(moreButton).toBeInTheDocument();
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

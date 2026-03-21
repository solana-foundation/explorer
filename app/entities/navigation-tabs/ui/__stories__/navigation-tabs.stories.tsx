import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, within } from 'storybook/test';

import { type NavigationTab } from '@/app/entities/navigation-tabs/model/types';
import { BaseNavigationTabs } from '@/app/entities/navigation-tabs/ui/BaseNavigationTabs';
import { NavigationTabLink } from '@/app/entities/navigation-tabs/ui/NavigationTabLink';

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
        onSelectChange: fn(),
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

export const WithChildren: Story = {
    args: {
        activeValue: '',
        tabs: BLOCK_TABS,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const tablist = canvas.getByRole('tablist', { hidden: true });
        const tabs = within(tablist).getAllByRole('tab', { hidden: true });
        expect(tabs).toHaveLength(6);
        expect(tabs[4]).toHaveTextContent('Async Tab 1');
        expect(tabs[5]).toHaveTextContent('Async Tab 2');

        // Async tabs should register into the select as well
        const select = canvasElement.querySelector('select') as HTMLSelectElement;
        expect(select.options).toHaveLength(6);
        expect(select.options[4]).toHaveTextContent('Async Tab 1');
        expect(select.options[5]).toHaveTextContent('Async Tab 2');
    },
    render: args => (
        <BaseNavigationTabs {...args}>
            <NavigationTabLink path="extra-1" title="Async Tab 1" />
            <NavigationTabLink path="extra-2" title="Async Tab 2" />
        </BaseNavigationTabs>
    ),
};

export const MobileSelect: Story = {
    args: {
        activeValue: 'rewards',
        tabs: BLOCK_TABS,
    },
    parameters: {
        viewport: {
            defaultViewport: 'mobile1',
        },
    },
    play: async ({ canvasElement, args }) => {
        const select = canvasElement.querySelector('select') as HTMLSelectElement;
        expect(select).toBeTruthy();
        expect(select.options).toHaveLength(4);
        expect(select.value).toBe('rewards');

        // Simulate user selecting a different option
        select.value = 'programs';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        expect(args.onSelectChange).toHaveBeenCalledWith('programs');
    },
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

        // Desktop tablist: 4 static + 2 children rendered (both appear in DOM)
        expect(tabs).toHaveLength(6);

        // Mobile select: should deduplicate "rewards", so 4 static + 1 new = 5
        const select = canvasElement.querySelector('select') as HTMLSelectElement;
        expect(select.options).toHaveLength(5);
        expect(select.options[4]).toHaveTextContent('Extra Tab');
    },
    render: args => (
        <BaseNavigationTabs {...args}>
            {/* "rewards" overlaps with static tab, "extra" is new */}
            <NavigationTabLink path="rewards" title="Rewards" />
            <NavigationTabLink path="extra" title="Extra Tab" />
        </BaseNavigationTabs>
    ),
};

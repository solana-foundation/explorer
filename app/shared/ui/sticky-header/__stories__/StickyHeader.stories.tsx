import type { Meta, StoryObj } from '@storybook/react';

import { type NavigationTab } from '@/app/shared/ui/navigation-tabs/model/types';
import { BaseNavigationTabs } from '@/app/shared/ui/navigation-tabs/ui/BaseNavigationTabs';
import { StickyHeader } from '@/app/shared/ui/sticky-header/StickyHeader';

const meta: Meta<typeof StickyHeader> = {
    component: StickyHeader,
    title: 'Components/Shared/UI/StickyHeader',
};

export default meta;
type Story = StoryObj<typeof meta>;

const TABS: NavigationTab[] = [
    { path: '', title: 'Transactions' },
    { path: 'rewards', title: 'Rewards' },
    { path: 'programs', title: 'Programs' },
    { path: 'accounts', title: 'Accounts' },
];

const buildHref = (path: string) => `#${path}`;

export const Default: Story = {
    decorators: [
        Story => (
            <div style={{ height: 200 }} className="container e-relative e-overflow-auto">
                <Story />
                <div style={{ height: 600, paddingTop: 16 }}>
                    <p className="e-text-sm e-text-neutral-400">Scroll down to see the sticky behavior.</p>
                </div>
            </div>
        ),
    ],
    render: () => (
        <StickyHeader>
            <div className="container">
                <BaseNavigationTabs activeValue="" buildHref={buildHref} tabs={TABS} onSelectChange={() => {}} />
            </div>
        </StickyHeader>
    ),
};

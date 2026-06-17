import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { type NavigationTab } from '@/app/shared/ui/navigation-tabs/model/types';
import { BaseNavigationTabs } from '@/app/shared/ui/navigation-tabs/ui/BaseNavigationTabs';
import { PageContainer } from '@/app/shared/ui/page-container/PageContainer';
import { StickyHeader } from '@/app/shared/ui/sticky-header/StickyHeader';

const meta: Meta<typeof StickyHeader> = {
    component: StickyHeader,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/StickyHeader',
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
            <PageContainer style={{ height: 200 }} className="relative overflow-auto">
                <Story />
                <div style={{ height: 600, paddingTop: 16 }}>
                    <p className="text-sm text-neutral-400">Scroll down to see the sticky behavior.</p>
                </div>
            </PageContainer>
        ),
    ],
    render: () => (
        <StickyHeader>
            <PageContainer>
                <BaseNavigationTabs activeValue="" buildHref={buildHref} tabs={TABS} onSelectChange={() => {}} />
            </PageContainer>
        </StickyHeader>
    ),
};

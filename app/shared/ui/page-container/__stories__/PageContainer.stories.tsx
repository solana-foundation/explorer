import type { Meta, StoryObj } from '@storybook-config/types';

import { PageContainer } from '../PageContainer';

const meta = {
    component: PageContainer,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/PageContainer',
} satisfies Meta<typeof PageContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

const Filler = () => (
    <div className="rounded-md border border-solid border-neutral-700 bg-neutral-900 px-4 py-6 text-neutral-200">
        Centered, breakpoint-capped content. Resize the viewport to see max-width step at sm / md / lg / xl.
    </div>
);

export const Default: Story = {
    render: args => (
        <PageContainer {...args}>
            <Filler />
        </PageContainer>
    ),
};

export const WithExtraClasses: Story = {
    args: { className: 'mt-6 mb-8' },
    render: args => (
        <PageContainer {...args}>
            <Filler />
        </PageContainer>
    ),
};

// Replaces Bootstrap's `container mt-n3` — container pulled up under the page header's bottom padding.
export const PulledUp: Story = {
    args: { variant: 'pulled-up' },
    render: args => (
        <div className="bg-neutral-800 pb-3 pt-6">
            <PageContainer {...args}>
                <Filler />
            </PageContainer>
        </div>
    ),
};

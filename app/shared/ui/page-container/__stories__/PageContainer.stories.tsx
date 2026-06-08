import type { Meta, StoryObj } from '@storybook/react';

import { PageContainer } from '../PageContainer';

const meta = {
    component: PageContainer,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/UI/PageContainer',
} satisfies Meta<typeof PageContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

const Filler = () => (
    <div className="e-rounded-md e-border e-border-solid e-border-neutral-700 e-bg-neutral-900 e-px-4 e-py-6 e-text-neutral-200">
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
    args: { className: 'e-mt-6 e-mb-8' },
    render: args => (
        <PageContainer {...args}>
            <Filler />
        </PageContainer>
    ),
};

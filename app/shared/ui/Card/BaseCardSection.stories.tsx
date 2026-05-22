import type { Meta, StoryObj } from '@storybook/react';

import { BaseCard, BaseCardBody } from './BaseCard';
import { BaseCardSection } from './BaseCardSection';

const meta: Meta<typeof BaseCardSection> = {
    component: BaseCardSection,
    title: 'Components/Shared/UI/Card/BaseCardSection',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Tw: Story = {
    args: { title: 'Arguments', ui: 'tw' },
    render: args => (
        <BaseCard ui="tw" variant="tight" className="e-w-full e-max-w-xl">
            <BaseCardSection {...args}>
                <div className="e-p-6">Section body content.</div>
            </BaseCardSection>
        </BaseCard>
    ),
};

export const Dashkit: Story = {
    args: { title: 'Arguments', ui: 'dashkit' },
    render: args => (
        <BaseCard ui="dashkit" className="e-w-full e-max-w-xl">
            <BaseCardSection {...args}>
                <BaseCardBody>Section body content.</BaseCardBody>
            </BaseCardSection>
        </BaseCard>
    ),
};

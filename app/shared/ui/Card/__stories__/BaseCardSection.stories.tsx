import type { Meta, StoryObj } from '@storybook/react';

import { BaseCard, BaseCardBody } from '../BaseCard';
import { BaseCardSection } from '../BaseCardSection';

const meta: Meta<typeof BaseCardSection> = {
    component: BaseCardSection,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/Card/BaseCardSection',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Tw: Story = {
    args: { title: 'Arguments', ui: 'tw' },
    render: args => (
        <BaseCard ui="tw" variant="tight" className="w-full max-w-xl">
            <BaseCardSection {...args}>
                <div className="p-6">Section body content.</div>
            </BaseCardSection>
        </BaseCard>
    ),
};

export const Dashkit: Story = {
    args: { title: 'Arguments', ui: 'dashkit' },
    render: args => (
        <BaseCard ui="dashkit" className="w-full max-w-xl">
            <BaseCardSection {...args}>
                <BaseCardBody ui="dashkit">Section body content.</BaseCardBody>
            </BaseCardSection>
        </BaseCard>
    ),
};

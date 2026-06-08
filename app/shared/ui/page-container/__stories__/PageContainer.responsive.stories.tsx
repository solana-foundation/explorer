import type { Meta, StoryObj } from '@storybook/react';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { PageContainer } from '../PageContainer';

const meta: Meta<typeof PageContainer> = {
    component: PageContainer,
    decorators: [withViewportFromGlobal],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/UI/PageContainer/Responsive',
};

export default meta;
type Story = StoryObj<typeof meta>;

const render = () => (
    <PageContainer>
        <div className="e-rounded-md e-border e-border-solid e-border-neutral-700 e-bg-neutral-900 e-px-4 e-py-6 e-text-neutral-200">
            Page container at current viewport
        </div>
    </PageContainer>
);

export const Mobile: Story = {
    globals: { viewport: { value: 'iphonex' } },
    render,
};

export const TabletPortrait: Story = {
    globals: { viewport: { value: 'ipad' } },
    render,
};

export const TabletLandscape: Story = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
    render,
};

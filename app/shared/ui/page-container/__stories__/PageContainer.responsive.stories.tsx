import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { PageContainer } from '../PageContainer';
import * as Base from './PageContainer.stories';

const meta: Meta<typeof PageContainer> = {
    component: PageContainer,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/PageContainer@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const { render } = Base.Default;

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

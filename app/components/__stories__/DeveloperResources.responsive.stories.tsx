import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { DeveloperResources } from '../DeveloperResources';

// The phone width is where the cards overflow the row and the dots under it show which ones are on screen.
const meta = {
    component: DeveloperResources,
    decorators: [withViewportFromGlobal],
    parameters: { viewport: { options: INITIAL_VIEWPORTS } },
    tags: ['autodocs', 'test'],
    title: 'Components/DeveloperResources@Media',
} satisfies Meta<typeof DeveloperResources>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
    globals: { viewport: { value: 'iphonex' } },
};

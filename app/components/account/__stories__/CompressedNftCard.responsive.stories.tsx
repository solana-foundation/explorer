import { withClusterAndAccounts } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { CompressedNFTHeader } from '../CompressedNftCard';
import * as Base from './CompressedNftCard.stories';

const meta: Meta<typeof CompressedNFTHeader> = {
    component: CompressedNFTHeader,
    decorators: [withClusterAndAccounts, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/CompressedNFTHeader@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.Default.args;

export const Mobile: Story = {
    args,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};

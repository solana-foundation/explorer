import { withClusterAndAccounts } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { MetaplexNFTHeader } from '../MetaplexNFTHeader';
import * as Base from './MetaplexNFTHeader.stories';

const meta: Meta<typeof MetaplexNFTHeader> = {
    component: MetaplexNFTHeader,
    decorators: [withClusterAndAccounts, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/MetaplexNFTHeader@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.MasterEdition.args;

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

import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseTokenTransfersCard } from '../BaseTokenTransfersCard';
import { TRANSFER_ROWS } from './TokenTransfersCard.fixtures';

const meta = {
    args: {
        fetching: false,
        foundOldest: false,
        onLoadMore: () => {},
        onRefresh: () => {},
        rows: TRANSFER_ROWS,
    },
    component: BaseTokenTransfersCard,
    decorators: [withCluster, withTokenInfoBatch, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/History/TokenTransfersCard@Media',
} satisfies Meta<typeof BaseTokenTransfersCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = { globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { globals: { viewport: { isRotated: true, value: 'ipad' } } };

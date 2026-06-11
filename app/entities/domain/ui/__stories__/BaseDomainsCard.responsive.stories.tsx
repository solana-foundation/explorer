import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { BaseDomainsCard } from '../BaseDomainsCard';

const meta: Meta<typeof BaseDomainsCard> = {
    component: BaseDomainsCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Entities/Domain/UI/BaseDomainsCard/Responsive',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    domains: [
        { address: '5ASxtmcPKDeD8NoE5QpskizPokqDdX1qHFiqZb1spLdo', name: 'example.sol' },
        { address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', name: 'bob.sol' },
    ],
};

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };

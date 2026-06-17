import type { Meta, StoryObj } from '@storybook/react';
import { mockAccountHistory, mockConfirmedSignatureInfo } from '@storybook-config/__fixtures__/account-history';
import { nextjsParameters, withHistory } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { TokenInstructionsCard } from '../TokenInstructionsCard';

const ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

const meta: Meta<typeof TokenInstructionsCard> = {
    component: TokenInstructionsCard,
    decorators: [withHistory, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        history: {
            [ADDRESS]: mockAccountHistory({
                fetched: [mockConfirmedSignatureInfo({ blockTime: null, slot: 312_456_789 })],
                foundOldest: true,
            }),
        },
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/History/TokenInstructionsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { address: ADDRESS };

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };

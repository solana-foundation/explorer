import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClipboardMock, withCluster } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { IdlCard } from '../IdlCard';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
// Storybook resolves IDL hooks to no-IDL → empty state with upload instructions.
const meta = {
    component: IdlCard,
    decorators: [withViewportFromGlobal, withCluster, withClipboardMock],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/UI/IdlCard@Media',
} satisfies Meta<typeof IdlCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = { programId: PublicKey.default.toBase58() };

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

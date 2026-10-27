import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { SolanaAttestationDetailsCard } from '../SolanaAttestationDetailsCard';
import * as Base from './SolanaAttestationDetailsCard.stories';

const meta: Meta<typeof SolanaAttestationDetailsCard> = {
    component: SolanaAttestationDetailsCard,
    decorators: [...Base.default.decorators, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Features/DecodeInstructionSas/SolanaAttestationDetailsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.Default.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };

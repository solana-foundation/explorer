import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { IMAGE_SIZE } from '../../constants';
import { BaseFeatureGateImage, MAX_TITLE_LENGTH } from '../BaseFeatureGateImage';

const meta: Meta<typeof BaseFeatureGateImage> = {
    argTypes: {
        simds: {
            control: 'object',
            description: 'SIMD proposal numbers',
        },
        title: {
            control: 'text',
            description: 'Feature gate title',
        },
    },
    component: BaseFeatureGateImage,
    decorators: [
        Story => (
            <div style={{ height: IMAGE_SIZE.height, width: IMAGE_SIZE.width }}>
                <Story />
            </div>
        ),
    ],
    title: 'Features/FeatureGate/BaseFeatureGateImage',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        simds: ['148'],
        title: 'MoveStake and MoveLamports',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('SIMD-0148')).toBeInTheDocument();
        expect(canvas.getByText('MoveStake and MoveLamports')).toBeInTheDocument();
    },
};

export const MultipleSimds: Story = {
    args: {
        simds: ['47', '61'],
        title: 'Enable address lookup table program',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('SIMD-0047, SIMD-0061')).toBeInTheDocument();
    },
};

export const MultilineTitle: Story = {
    args: {
        simds: ['321'],
        title: 'Instruction Data Pointer in VM Register 2 with Extended Buffer Support',
    },
};

export const TruncatedTitle: Story = {
    args: {
        simds: ['999'],
        title: 'Enable Partitioned Epoch Rewards Distribution Across Multiple Blocks with Automatic Stake Account Crediting and Comprehensive Validator Performance Tracking Including Cross-Cluster Synchronization of Reward Calculations and Delinquency Penalty Adjustments for Low-Performing Nodes',
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const expectedText = `${args.title.slice(0, MAX_TITLE_LENGTH)}\u2026`;
        expect(canvas.getByText(expectedText)).toBeInTheDocument();
    },
};

export const NoSimd: Story = {
    args: {
        simds: [],
        title: 'Deprecate legacy transaction format',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.queryByText('SIMD', { exact: false })).not.toBeInTheDocument();
        expect(canvas.getByText('Deprecate legacy transaction format')).toBeInTheDocument();
    },
};

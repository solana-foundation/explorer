import type { Meta, StoryObj } from '@storybook-config/types';

import { projectResourceAndInclusionFees } from '../../lib/resource-and-inclusion-fee';
import { BaseResourceFeeProjection } from '../BaseResourceFeeProjection';

const meta = {
    args: {
        currentFeeLamports: 5_000,
        projections: projectResourceAndInclusionFees({ priorityFeeLamports: 0, requestedCostUnits: 2_331 }),
    },
    component: BaseResourceFeeProjection,
    tags: ['autodocs', 'test'],
    title: 'Entities/TransactionFee/BaseResourceFeeProjection',
} satisfies Meta<typeof BaseResourceFeeProjection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An accurately budgeted transfer: cheap enough that even the terminal rate undercuts today's flat base fee. */
export const LeanTransfer: Story = {};

/** A wallet that left the default 200,000 compute unit request in place. */
export const LooseComputeBudget: Story = {
    args: {
        projections: projectResourceAndInclusionFees({ priorityFeeLamports: 0, requestedCostUnits: 201_331 }),
    },
};

/** A priority fee dwarfs both models, so the staged rates barely move the total. */
export const WithLargePriorityFee: Story = {
    args: {
        currentFeeLamports: 1_005_000,
        projections: projectResourceAndInclusionFees({
            priorityFeeLamports: 1_000_000,
            requestedCostUnits: 201_331,
        }),
    },
};

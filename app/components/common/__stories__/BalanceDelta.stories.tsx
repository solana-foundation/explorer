import type { Meta, StoryObj } from '@storybook-config/types';
import BigNumber from 'bignumber.js';
import BN from 'bn.js';

import { BalanceDelta } from '../BalanceDelta';

const meta: Meta<typeof BalanceDelta> = {
    component: BalanceDelta,
    tags: ['autodocs', 'test'],
    title: 'Components/Common/BalanceDelta',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Positive: Story = {
    args: { delta: new BigNumber(1_234) },
};

export const Negative: Story = {
    args: { delta: new BigNumber(-987) },
};

export const Zero: Story = {
    args: { delta: new BigNumber(0) },
};

export const PositiveSol: Story = {
    args: { delta: new BN('500000000'), isSol: true },
};

export const NegativeSol: Story = {
    args: { delta: new BN('-2500000000'), isSol: true },
};

import type { Meta, StoryObj } from '@storybook/react';

import { CUProfilingCard } from '../ui/CUProfilingCard';

const meta: Meta<typeof CUProfilingCard> = {
    component: CUProfilingCard,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    title: 'Components/Transaction/CUProfilingCard',
};

export default meta;
type Story = StoryObj<typeof CUProfilingCard>;

export const TwoInstructions: Story = {
    args: {
        instructions: [
            {
                computeUnits: 45000,
                minValue: 150,
                programId: '11111111111111111111111111111111',
            },
            {
                computeUnits: 45000,
                minValue: 150,
                programId: '22222222222222222222222222222222',
            },
        ],
    },
};

// Maximum color variations (10 instructions)
export const TenInstructions: Story = {
    args: {
        instructions: [
            { computeUnits: 100000, minValue: 150, programId: 'Program1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
            { computeUnits: 85000, minValue: 150, programId: 'Program2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
            { computeUnits: 70000, minValue: 150, programId: 'Program3xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
            { computeUnits: 55000, minValue: 150, programId: 'Program4xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
            { computeUnits: 40000, minValue: 150, programId: 'Program5xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
            { computeUnits: 30000, minValue: 150, programId: 'Program6xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
            { computeUnits: 20000, minValue: 150, programId: 'Program7xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
            { computeUnits: 15000, minValue: 150, programId: 'Program8xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
            { computeUnits: 10000, minValue: 150, programId: 'Program9xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
            { computeUnits: 5000, minValue: 150, programId: 'Program10xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
        ],
    },
};

export const WithZeroComputeUnits: Story = {
    args: {
        instructions: [
            {
                computeUnits: 50000,
                minValue: 150,
                programId: '11111111111111111111111111111111',
            },
            {
                computeUnits: 0,
                displayUnits: 1200,
                minValue: 150,
                programId: 'AddressLookupTab1e1111111111111111111111111',
                reservedValue: 1200,
            },
            {
                computeUnits: 30000,
                minValue: 150,
                programId: '33333333333333333333333333333333',
            },
        ],
        unitsConsumed: 51200,
    },
};

// Empty case (should render nothing)
export const EmptyInstructions: Story = {
    args: {
        instructions: [],
    },
};

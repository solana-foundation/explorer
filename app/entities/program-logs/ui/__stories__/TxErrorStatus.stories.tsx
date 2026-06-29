import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { TxErrorStatus } from '../TxErrorStatus';

const date = new Date('2024-01-15T10:30:00Z');
const serializedMessage =
    'AQADByTPMvZ5NhbwY7GzM3bmF6aUB0Es9utyRgN3KoaqxFltNfKjDEAu3mQ7ldMPRzdZ2rwfown8mXJVsLSeFIoWPQObM34V+KEVoZ/byZ2YI49FXsL/HFdFCreG7S85NtrCJdK1H1URKpBmcuP98y+e8a7uDW4LI8LKAiAZBUh7wxywejJclj04kifG7PRApFI4NgwtaE5na/xCEBI572Nvp+FnG+nrzvtutOj1l82qryXQxsbvkwtL24OR8pgIDRS9dYQbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/+CpsOI2EcJQ6duyss4+/+RYbQUQYEI4NS2+k6O1be30VWMBBAcDBQECBQAGAQI=';
const inspectorLink = `/tx/inspector?message=${serializedMessage}`;

const meta = {
    component: TxErrorStatus,
    globals: { viewport: { value: 'responsive' } },
    tags: ['autodocs', 'test'],
    title: 'Entities/Program Logs/TxErrorStatus',
} satisfies Meta<typeof TxErrorStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        date,
        link: inspectorLink,
        message: serializedMessage,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText(serializedMessage)).toBeInTheDocument();
        expect(canvas.getByText('10:30:00 UTC')).toBeInTheDocument();
        expect(canvas.getByRole('link')).toHaveAttribute('href', inspectorLink);
    },
};

export const NullMessage: Story = {
    args: {
        date,
        link: undefined,
        message: undefined,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.queryByRole('link')).not.toBeInTheDocument();
        expect(canvas.getByText('Error', { exact: false })).toBeInTheDocument();
    },
};

export const CustomLabel: Story = {
    args: {
        date,
        label: 'Simulation Error',
        link: undefined,
        message: 'AccountNotFound: account does not exist or has no data',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Simulation Error', { exact: false })).toBeInTheDocument();
        expect(canvas.queryByRole('link')).not.toBeInTheDocument();
    },
};

import type { Meta, StoryObj } from '@storybook/react';

import { TxErrorStatus } from '../TxErrorStatus';

const meta = {
    component: TxErrorStatus,
    decorators: [
        Story => (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    maxWidth: '100%',
                    width: '800px',
                }}
            >
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    title: 'Entities/Program Logs/UI/TxErrorStatus',
} satisfies Meta<typeof TxErrorStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

const testMessage = () =>
    'AQADByTPMvZ5NhbwY7GzM3bmF6aUB0Es9utyRgN3KoaqxFltNfKjDEAu3mQ7ldMPRzdZ2rwfown8mXJVsLSeFIoWPQObM34V+KEVoZ/byZ2YI49FXsL/HFdFCreG7S85NtrCJdK1H1URKpBmcuP98y+e8a7uDW4LI8LKAiAZBUh7wxywejJclj04kifG7PRApFI4NgwtaE5na/xCEBI572Nvp+FnG+nrzvtutOj1l82qryXQxsbvkwtL24OR8pgIDRS9dYQbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/+CpsOI2EcJQ6duyss4+/+RYbQUQYEI4NS2+k6O1be30VWMBBAcDBQECBQAGAQI=';

export const Default: Story = {
    args: {
        date: new Date('2024-01-15T10:30:00Z'),
        link: `/tx/inspector?message=${testMessage()}`,
        message: testMessage(),
    },
};

export const NullMessage: Story = {
    args: {
        date: new Date('2024-01-15T10:30:00Z'),
        link: null,
        message: null,
    },
};

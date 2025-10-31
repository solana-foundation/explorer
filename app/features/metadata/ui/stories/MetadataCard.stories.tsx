import type { Meta, StoryObj } from '@storybook/react';

import {
    getMockAccountWithNFTData,
    getMockAccountWithTokenMetadata,
    getMockAccountWithTokenMetadataAndMetaplexMetadata,
} from '../../mocks';
import { MetadataCard } from '../MetadataCard';

const meta = {
    component: MetadataCard,
    decorators: [
        Story => (
            <div>
                <Story />
            </div>
        ),
    ],
    parameters: {
        nextjs: {
            appDirectory: true,
        },
    },
    tags: ['autodocs'],
    title: 'Features/Metadata/MetadataCard',
} satisfies Meta<typeof MetadataCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MetaplexMetadata: Story = {
    args: {
        account: getMockAccountWithNFTData(),
    },
};

export const TokenExtensionMetadata: Story = {
    args: {
        account: getMockAccountWithTokenMetadata(),
    },
};

export const TokenExtensionAndMetaplexMetadata: Story = {
    args: {
        account: getMockAccountWithTokenMetadataAndMetaplexMetadata(),
    },
};

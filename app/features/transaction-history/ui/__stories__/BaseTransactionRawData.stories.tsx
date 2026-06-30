import { withClipboardMock } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseTransactionRawData } from '../BaseTransactionRawData';

const SAMPLE_DATA = new Uint8Array([72, 101, 108, 108, 111]);
const SIGNATURE = '2JgaFoExampleRawDataSignaturePlaceholderForStoriesZBbGUabcdefghijkmnopqrst';

const meta = {
    args: { onHover: () => {} },
    component: BaseTransactionRawData,
    decorators: [withClipboardMock],
    tags: ['autodocs', 'test'],
    title: 'Features/TransactionHistory/TransactionRawData',
} satisfies Meta<typeof BaseTransactionRawData>;

export default meta;
type Story = StoryObj<typeof meta>;

// Not yet fetched — nothing to copy or download.
export const NoData: Story = {
    args: { data: undefined, loading: false, signature: SIGNATURE },
};

export const Loading: Story = {
    args: { data: undefined, loading: true, signature: SIGNATURE },
};

export const WithData: Story = {
    args: { data: SAMPLE_DATA, loading: false, signature: SIGNATURE },
};

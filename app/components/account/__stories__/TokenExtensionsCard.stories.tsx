import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterAndAccounts } from '@storybook-config/decorators';

import { TokenExtensionsCard } from '../TokenExtensionsCard';

// Without a working /api/token-info backend, SWR stays in loading and the card renders
// LoadingCard. The populated visual is covered by the TokenExtensionsSection story.
const meta = {
    component: TokenExtensionsCard,
    decorators: [withClusterAndAccounts],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/TokenExtensionsCard',
} satisfies Meta<typeof TokenExtensionsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
    args: {
        address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        decimals: 6,
        extensions: [],
    },
};

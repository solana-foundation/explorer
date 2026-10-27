import { gen } from '@__fixtures__/gen';
import { makeAccount } from '@entities/account/__fixtures__/account';
import { withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { FeatureAccountSection } from '../FeatureAccountSection';

const meta = {
    component: FeatureAccountSection,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/FeatureAccountSection',
} satisfies Meta<typeof FeatureAccountSection>;

export default meta;
type Story = StoryObj<typeof meta>;

// Random pubkey that won't match any known feature gate; ErrorBoundary falls back to UnknownAccountCard
// when isFeature parsing fails on the empty account body.
const unknownAccount = makeAccount({ pubkey: gen.publicKey(1), space: 9 });

export const UnknownFeatureAccount: Story = {
    args: {
        account: unknownAccount,
    },
};

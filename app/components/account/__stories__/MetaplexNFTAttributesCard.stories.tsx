import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { nextjsParameters } from '@storybook-config/decorators';

import { NormalMetaplexNFTAttributesCard } from '../MetaplexNFTAttributesCard';

const METADATA_URI = 'https://example.test/nft-metadata.json';

const sampleAttributesJson = {
    attributes: [
        { trait_type: 'Background', value: 'Cosmic Purple' },
        { trait_type: 'Eyes', value: 'Laser' },
        { trait_type: 'Mouth', value: 'Smile' },
        { trait_type: 'Rarity Rank', value: 42 },
    ],
};

// Installs the fetch override at decorator render time (synchronously) so the inner
// component's mount-time useEffect sees the mock. No cleanup is needed — Storybook
// re-runs decorators per story and the next story's decorator replaces it.
function makeFetchOverride(body: unknown, ok = true): Decorator {
    const FetchOverride: Decorator = Story => {
        global.fetch = (async () =>
            ({
                json: async () => body,
                ok,
            }) as Response) as typeof fetch;
        return <Story />;
    };
    return FetchOverride;
}

const meta = {
    component: NormalMetaplexNFTAttributesCard,
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/MetaplexNFTAttributesCard',
} satisfies Meta<typeof NormalMetaplexNFTAttributesCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithAttributes: Story = {
    args: { metadataUri: METADATA_URI },
    decorators: [makeFetchOverride(sampleAttributesJson)],
};

export const MalformedResponse: Story = {
    args: { metadataUri: METADATA_URI },
    decorators: [makeFetchOverride({ attributes: 'not-an-array' })],
};

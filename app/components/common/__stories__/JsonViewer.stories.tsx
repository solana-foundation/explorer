import { withClipboardMock } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, userEvent, within } from 'storybook/test';

import { JsonViewer } from '../JsonViewer';

const sampleData = {
    accounts: [
        { isSigner: true, isWritable: true, pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { isSigner: false, isWritable: true, pubkey: '11111111111111111111111111111111' },
    ],
    data: '0xdeadbeef',
    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
};

const meta = {
    component: JsonViewer,
    parameters: {
        docs: {
            description: {
                component: [
                    'Two versions behind one `version` prop. `v1` (default) is react-json-view with its own props',
                    'and themes. `v2` is the design-system tree: always expanded, keys muted, strings light,',
                    'numbers and booleans in blue (green is kept for the copy highlight), `null` dimmed. Long values',
                    'wrap inside their row, so the block never scrolls sideways.',
                    '',
                    'In `v2` the copy button in the top-right corner copies the whole block as indented JSON. Every',
                    'other row shows its own copy button on hover, right after its text: a nested row copies its',
                    "object or array, a value row copies the bare value. Hovering a row's copy button highlights",
                    'the text it copies, not the whole row: a value without its key and quotes, an object with its',
                    'brackets and contents. The corner button highlights nothing. On touch screens the row buttons',
                    'stay visible.',
                    '',
                    '## References',
                    '',
                    '- [CopyButton](?path=/docs/shared-copybutton--docs) — `v2` copy control, borderless (`variant="quiet"`) and sized to a line of text.',
                    '- [CodeBlock](?path=/docs/shared-codeblock-basecodeblock--docs) — the other block with a borderless copy button in its top-right corner.',
                ].join('\n'),
            },
        },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Common/JsonViewer',
} satisfies Meta<typeof JsonViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

// text-dk-gray-700 is rendered in the dynamic-import loading state; usually only briefly visible.
export const Default: Story = {
    args: { collapsed: 1, name: null, src: sampleData },
};

// What `SolarizedJsonViewer` renders.
export const Solarized: Story = {
    args: { collapsed: 1, name: null, src: sampleData, theme: 'solarized' },
};

// SAS attestation 11UR6sZ57WRDtmd27JK9vMaoCwXeb8rVgdJ93zCajhH: flat strings, including an address.
export const V2Flat: Story = {
    args: {
        src: {
            chain: 'solana',
            index: '1',
            score: '56.59',
            subject: 'DToHw4dE9SP67V9YPiADCein5T4HB6piE25VW6WhsxRG',
            timestamp: '1757785289',
        },
        version: 'v2',
    },
    decorators: [withClipboardMock],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Copy JSON' }));
        await expect(canvas.getByRole('button', { name: 'Copied JSON' })).toBeInTheDocument();
        await userEvent.click(canvas.getByRole('button', { name: 'Copy subject' }));
        await expect(canvas.getByRole('button', { name: 'Copied subject' })).toBeInTheDocument();
    },
};

// Off-chain JSON of the compressed NFT JEKNVWWk5oPzAawWu1BKDS4s11PMvnQ9scDCvRa7eSuf: arrays of objects and
// long URIs.
export const V2Nested: Story = {
    args: {
        src: {
            animation_url: '',
            attributes: [
                { trait_type: 'Drop', value: '9' },
                { trait_type: 'Minted', value: '03/25/2024' },
                { trait_type: 'File Type', value: 'GIF' },
                { trait_type: 'Dimensions', value: '1080x1080' },
                { trait_type: 'Drop Type', value: 'Cinematic Content' },
                { trait_type: 'Rarity', value: 'Common' },
            ],
            description: 'Cinematic shots of BR1: Operatives getting ready for battle.',
            external_url: 'https://drip.haus/br1',
            image: 'https://arweave.net/Qs97XriLrdidgoZlq6sf00YoLXyrIRRZ5RuDRFj4mrE?ext=gif',
            name: "Bird's-Eye View",
            properties: {
                category: 'image',
                files: [
                    {
                        type: 'image/gif',
                        uri: 'https://arweave.net/Qs97XriLrdidgoZlq6sf00YoLXyrIRRZ5RuDRFj4mrE?ext=gif',
                    },
                ],
            },
            symbol: '',
        },
        version: 'v2',
    },
    decorators: [withClipboardMock],
};

// Metaplex metadata of the pNFT 13vudpRiKaMRg1fif48NkAQF3o4B9EsBbWwfRKyc64VE: numbers, booleans, nulls and
// nested objects.
export const V2MixedTypes: Story = {
    args: {
        src: {
            collection: { key: '37nGhj3rffAwTHMoCm3HSByM3eYFi1N5x1ED2ZuakgC3', verified: true },
            collectionDetails: null,
            creators: [
                { address: '9W9kivfHuxty3dWZEnnFswXWakhH48LDjNMMU2wgpvPf', share: 0, verified: true },
                { address: 'D47KLr3JcT1CCG7drtmrzDBfQ2tWRyM9qKmAMN1pv8CN', share: 100, verified: false },
            ],
            editionNonce: 254,
            isMutable: true,
            key: 4,
            mint: '13vudpRiKaMRg1fif48NkAQF3o4B9EsBbWwfRKyc64VE',
            name: 'ZBB #2556',
            primarySaleHappened: true,
            programmableConfig: { __kind: 'V1', ruleSet: 'eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9' },
            sellerFeeBasisPoints: 500,
            symbol: 'ZBB',
            tokenStandard: 4,
            updateAuthority: 'D47KLr3JcT1CCG7drtmrzDBfQ2tWRyM9qKmAMN1pv8CN',
            uri: 'https://nftstorage.link/ipfs/bafybeif37ezxcjadjy6jevcgjdv45sn3ltyxw3y4y6i4co2xwd3ba6vrhi/2556.json',
            uses: null,
        },
        version: 'v2',
    },
    decorators: [withClipboardMock],
};

// Token-2022 metadata of 6H49BjeAGsXeof5HbLqADmHpCXVFapFe6PMVNxruJpi4: key–value pairs as nested arrays, one
// key an address.
export const V2NestedArrays: Story = {
    args: {
        src: {
            additionalMetadata: [
                ['royalty_basis_points', '500'],
                ['5AdNuK2RfGxKhk7gGQZxN6S4a5LNRUn8Q1ry6fSWg85n', '100'],
            ],
            mint: '6H49BjeAGsXeof5HbLqADmHpCXVFapFe6PMVNxruJpi4',
            name: 'Elements #8142',
            symbol: 'ELMNTS',
            updateAuthority: '5AdNuK2RfGxKhk7gGQZxN6S4a5LNRUn8Q1ry6fSWg85n',
            uri: 'https://storage.googleapis.com/assetdash-elements-collection/meta/8142.json',
        },
        version: 'v2',
    },
    decorators: [withClipboardMock],
};

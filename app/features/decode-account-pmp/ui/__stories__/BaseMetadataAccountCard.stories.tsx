import { decodePmpPayload } from '@entities/pmp-account';
import { Compression } from '@solana-program/program-metadata';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { gzip } from 'pako';

import {
    IDL_DOC,
    metadataAccountData,
    metadataBase64AccountData,
    pack,
    readAs,
} from '../__fixtures__/pmp-account-fixtures';
import { BaseMetadataAccountCard } from '../BaseMetadataAccountCard';

function argsFor(raw: Uint8Array) {
    const metadata = readAs(raw, 'metadata');
    const body = metadata.account.data.subarray(0, metadata.account.dataLength);

    return {
        metadata,
        payload: {
            payload: decodePmpPayload({ config: metadata.account, data: body }),
            status: 'ready' as const,
        },
    };
}

const meta = {
    component: BaseMetadataAccountCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/DecodeAccountPmp/BaseMetadataAccountCard',
} satisfies Meta<typeof BaseMetadataAccountCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MetadataDecoded: Story = {
    args: argsFor(metadataAccountData(pack(IDL_DOC, Compression.Zlib))),
};

export const MetadataDecoding: Story = {
    args: { ...argsFor(metadataAccountData(pack(IDL_DOC, Compression.Zlib))), payload: { status: 'idle' } },
};

// The account parses fine - it is the CONTENT that is not the Zlib stream its header promises, which is what a
// partially written account looks like.
export const MetadataDecodeFailure: Story = {
    args: argsFor(metadataAccountData(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))),
};

/**
 * A Metadata account holding BINARY, which `Encoding.Base64` over a compiled blob is the ordinary way to store.
 * It must render through `RawDataField`.
 */
export const MetadataBinaryPayload: Story = {
    // `pako`, not `node:zlib` - these stories run in a real browser, where Node built-ins do not exist.
    args: argsFor(
        metadataBase64AccountData(gzip(Uint8Array.from({ length: 512 }, (_, index) => 128 + ((index * 37) % 128)))),
    ),
};

/**
 * Regression guard for horizontal overflow, on the path that still renders a document.
 */
export const MetadataUnbrokenText: Story = {
    args: argsFor(metadataAccountData(pack(`https://example.com/${'x'.repeat(600)}`, Compression.Zlib), 'security')),
};

import { gen } from '@__fixtures__/gen';
import { Compression, DataSource, Encoding, Format } from '@solana-program/program-metadata';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { resolveBufferConfigFromBytes } from '../../lib/config-resolution/resolve-buffer-config-from-bytes';
import { bufferAccountData, IDL_DOC, pack, readAs, YAML_DOC } from '../__fixtures__/pmp-account-fixtures';
import { BaseBufferAccountCard } from '../BaseBufferAccountCard';

function bufferArgsFor(body: Uint8Array) {
    return {
        buffer: readAs(bufferAccountData(body), 'buffer'),
        configFromBytes: { result: resolveBufferConfigFromBytes(body), status: 'ready' as const },
        configFromOnchain: { status: 'skipped' as const },
    };
}

const meta = {
    component: BaseBufferAccountCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/DecodeAccountPmp/BaseBufferAccountCard',
} satisfies Meta<typeof BaseBufferAccountCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BufferAccount: Story = {
    args: bufferArgsFor(pack(IDL_DOC, Compression.Zlib)),
};

export const BufferReadingLoader: Story = {
    args: { ...bufferArgsFor(pack(IDL_DOC, Compression.Zlib)), configFromBytes: { status: 'idle' } },
};

export const BufferResolvedFromBytes: Story = {
    args: bufferArgsFor(Uint8Array.from({ length: 64 }, (_, index) => 128 + ((index * 37) % 128))),
};

export const BufferResolvedFromTx: Story = {
    args: {
        ...bufferArgsFor(pack(IDL_DOC, Compression.Gzip)),
        configFromOnchain: {
            result: {
                config: { compression: Compression.Gzip, encoding: Encoding.Utf8, format: Format.Json },
                dataSource: DataSource.Direct,
                kind: 'found-for-buffer-acc',
                signature: gen.signature(4),
            },
            status: 'ready',
        },
    },
};

/**
 * The canonical build path: nothing declared a config for this buffer, but its bytes were copied whole into a
 * metadata account whose `initialize` did. The note must name that account rather than implying the buffer states
 * the config, and the Format row it fills in - YAML - is one detection could never resolve on its own.
 */
export const BufferConfigFromMetadataAcc: Story = {
    args: {
        ...bufferArgsFor(pack(YAML_DOC, Compression.Gzip)),
        configFromOnchain: {
            result: {
                config: { compression: Compression.Gzip, encoding: Encoding.Utf8, format: Format.Yaml },
                dataSource: DataSource.Direct,
                kind: 'found-for-metadata-acc',
                metadata: gen.address(4),
                signature: gen.signature(4),
            },
            status: 'ready',
        },
    },
};

/**
 * The lookup is in flight.
 */
export const BufferResolvingConfig: Story = {
    args: {
        ...bufferArgsFor(pack(YAML_DOC, Compression.Gzip)),
        configFromOnchain: { status: 'loading' },
    },
};

/** A pending buffer: nothing consumed it, so the detected config stands. An ordinary state, not a failure. */
export const BufferNotFoundOnchain: Story = {
    args: {
        ...bufferArgsFor(new TextEncoder().encode('https://example.com/idl.json')),
        configFromOnchain: { result: { kind: 'not-found' }, status: 'ready' },
    },
};

/**
 * The scan died on the RPC rather than answering.
 */
export const BufferLookupFailed: Story = {
    args: {
        ...bufferArgsFor(pack(YAML_DOC, Compression.Gzip)),
        configFromOnchain: { result: { kind: 'failed', reason: 'fetch failed' }, status: 'ready' },
    },
};

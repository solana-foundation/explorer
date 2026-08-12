import { gen } from '@__fixtures__/gen';
import { PmpDetailsCard } from '@features/decode-instruction-pmp';
import type { Account, State } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    Compression,
    DataSource,
    Encoding,
    Format,
    getBufferEncoder,
    getInitializeInstructionDataEncoder,
    getSetDataInstructionDataEncoder,
    getWriteInstructionDataEncoder,
    packDirectData,
    PROGRAM_METADATA_PROGRAM_ADDRESS,
} from '@solana-program/program-metadata';
import {
    nextjsParameters,
    withCluster,
    withMockTransactions,
    withScrollAnchor,
    withTokenInfoBatch,
} from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { gzip } from 'pako';

const PROGRAM_ID = new PublicKey(PROGRAM_METADATA_PROGRAM_ADDRESS);

const IDL_DOC = JSON.stringify({
    instructions: [{ name: 'initialize' }],
    name: 'company_program',
    version: '1.0.0',
});

// Account addresses are labelled positionally from the card's static name table, so any keys work here. Seeded
// so the rendered addresses stay pixel-stable across runs.
function makeIx(data: Uint8Array, accountCount: number): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(data),
        keys: Array.from({ length: accountCount }, (_, index) => ({
            isSigner: false,
            isWritable: true,
            pubkey: gen.publicKey(index),
        })),
        programId: PROGRAM_ID,
    });
}

function setDataIx({
    compression,
    content,
    dataSource = DataSource.Direct,
    format,
}: {
    compression: Compression;
    content: string;
    dataSource?: DataSource;
    format: Format;
}) {
    const packed = packDirectData({ compression, content, encoding: Encoding.Utf8 });
    return makeIx(
        getSetDataInstructionDataEncoder().encode({
            compression: packed.compression,
            data: packed.data,
            dataSource,
            encoding: packed.encoding,
            format,
        }) as Uint8Array,
        5,
    );
}

const meta = {
    component: PmpDetailsCard,
    decorators: [withCluster, withScrollAnchor, withTokenInfoBatch, withMockTransactions],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/DecodeInstructionPmp/PmpDetailsCard',
} satisfies Meta<typeof PmpDetailsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// `fallback` is never exercised by these stories - every fixture below is a content instruction, so the card
// always takes its custom-render path. `null` is fine here: stories are exempt from `unicorn/no-null`.
const baseArgs = {
    fallback: null,
    index: 0,
    result: { err: null },
};

export const SetDataInlineJson: Story = {
    args: { ...baseArgs, ix: setDataIx({ compression: Compression.None, content: IDL_DOC, format: Format.Json }) },
};

export const SetDataZlibCompressedJson: Story = {
    args: { ...baseArgs, ix: setDataIx({ compression: Compression.Zlib, content: IDL_DOC, format: Format.Json }) },
};

export const SetDataOversizedGzip: Story = {
    args: {
        ...baseArgs,
        ix: makeIx(
            getSetDataInstructionDataEncoder().encode({
                compression: Compression.Gzip,
                data: gzip(new Uint8Array(20480)),
                dataSource: DataSource.Direct,
                encoding: Encoding.Base58,
                format: Format.None,
            }) as Uint8Array,
            5,
        ),
    },
};

export const SetDataYamlVerbatim: Story = {
    args: {
        ...baseArgs,
        ix: setDataIx({
            compression: Compression.None,
            content: 'name: company\nversion: 1.0.0\n',
            format: Format.Yaml,
        }),
    },
};

export const SetDataEncodingNoneAsHex: Story = {
    args: {
        ...baseArgs,
        ix: makeIx(
            getSetDataInstructionDataEncoder().encode({
                compression: Compression.None,
                data: new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0x11, 0x22, 0x33]),
                dataSource: DataSource.Direct,
                encoding: Encoding.None,
                format: Format.None,
            }) as Uint8Array,
            5,
        ),
    },
};

/**
 * Regression guard for horizontal overflow. `Encoding.Base64` over a binary payload renders as one unbroken
 * base64 token - 512 bytes become 684 characters with no space or newline anywhere in them.
 *
 * Under Tailwind's `break-words` that widened the whole card, because `overflow-wrap: break-word` does not
 * contribute to the min-content size the auto-layout table sizes its column from. The document must wrap inside
 * the card, with no horizontal scrollbar.
 */
export const SetDataBase64Binary: Story = {
    args: {
        ...baseArgs,
        ix: makeIx(
            getSetDataInstructionDataEncoder().encode({
                compression: Compression.None,
                data: Uint8Array.from({ length: 512 }, (_, index) => 128 + ((index * 37) % 128)),
                dataSource: DataSource.Direct,
                encoding: Encoding.Base64,
                format: Format.None,
            }) as Uint8Array,
            5,
        ),
    },
};

// The 4-byte header-only shape. The generated encoder cannot build it, so the bytes are a literal:
// discriminator 3, encoding Utf8, compression None, format Json.
export const SetDataHeaderOnly: Story = {
    args: { ...baseArgs, ix: makeIx(new Uint8Array([3, 1, 0, 1]), 5) },
};

// A Zlib stream that is not a Zlib stream, so the local decode fallback renders instead of the document.
export const SetDataDecodeFailure: Story = {
    args: {
        ...baseArgs,
        ix: makeIx(
            getSetDataInstructionDataEncoder().encode({
                compression: Compression.Zlib,
                data: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
                dataSource: DataSource.Direct,
                encoding: Encoding.Utf8,
                format: Format.Json,
            }) as Uint8Array,
            5,
        ),
    },
};

export const SetDataUrlSource: Story = {
    args: {
        ...baseArgs,
        ix: setDataIx({
            compression: Compression.None,
            content: 'https://example.com/company-idl.json',
            dataSource: DataSource.Url,
            format: Format.Json,
        }),
    },
};

export const InitializeInlineJson: Story = {
    args: {
        ...baseArgs,
        ix: makeIx(
            getInitializeInstructionDataEncoder().encode({
                compression: Compression.None,
                data: new TextEncoder().encode(IDL_DOC),
                dataSource: DataSource.Direct,
                encoding: Encoding.Utf8,
                format: Format.Json,
                seed: 'idl',
            }) as Uint8Array,
            5,
        ),
    },
};

export const WriteChunk: Story = {
    args: {
        ...baseArgs,
        ix: makeIx(
            getWriteInstructionDataEncoder().encode({
                data: new TextEncoder().encode('{"instructions":['),
                offset: 0,
            }) as Uint8Array,
            3,
        ),
    },
};

export const WriteFromBuffer: Story = {
    args: {
        ...baseArgs,
        ix: makeIx(getWriteInstructionDataEncoder().encode({ offset: 0 }) as Uint8Array, 3),
    },
};

// ===== setData sourced from a buffer account =====
//
// `data` is empty, so the payload is not in the instruction - it is in the buffer at account index 2, which the
// card reads on render. These stories pin index 2 to a legible address the mock accounts cache is seeded against.

const BUFFER_ADDRESS = gen.vanityAddress('BUFFer');

/** A `setData` carrying no inline bytes, naming `BUFFER_ADDRESS` as its source buffer. */
function setDataFromBufferIx({ compression, format }: { compression: Compression; format: Format }) {
    const ix = makeIx(
        getSetDataInstructionDataEncoder().encode({
            compression,
            // Empty rather than absent: `data` is a REMAINDER option, so both encode to no bytes, which is
            // exactly the on-chain shape that means "the payload lives in the buffer account".
            data: new Uint8Array(0),
            dataSource: DataSource.Direct,
            encoding: Encoding.Utf8,
            format,
        }) as Uint8Array,
        5,
    );
    ix.keys[2].pubkey = new PublicKey(BUFFER_ADDRESS);
    return ix;
}

/** The library's own encoder, so the fixture carries the real 96-byte Buffer header. */
function bufferAccountEntry(content: string, compression: Compression): State['entries'] {
    const packed = packDirectData({ compression, content, encoding: Encoding.Utf8 });
    const raw = getBufferEncoder().encode({
        authority: PROGRAM_METADATA_PROGRAM_ADDRESS,
        canonical: true,
        data: packed.data,
        program: PROGRAM_METADATA_PROGRAM_ADDRESS,
        seed: 'idl',
    }) as Uint8Array;

    const data: Account = {
        data: { raw },
        executable: false,
        lamports: 2_000_000,
        owner: PROGRAM_ID,
        pubkey: new PublicKey(BUFFER_ADDRESS),
        space: raw.length,
    };
    return { [BUFFER_ADDRESS]: { data, status: FetchStatus.Fetched } };
}

export const SetDataFromBufferDecoded: Story = {
    args: { ...baseArgs, ix: setDataFromBufferIx({ compression: Compression.Zlib, format: Format.Json }) },
    parameters: { accounts: bufferAccountEntry(IDL_DOC, Compression.Zlib) },
};

// The buffer is still live, but holds bytes that are not the Zlib stream its instruction hints promise.
export const SetDataFromBufferDecodeFailure: Story = {
    args: { ...baseArgs, ix: setDataFromBufferIx({ compression: Compression.Zlib, format: Format.Json }) },
    parameters: { accounts: bufferAccountEntry(IDL_DOC, Compression.None) },
};

// The common outcome on a historical transaction: the client closes the source buffer in the same flow to
// reclaim its rent, so there is nothing left to read. The provider models that as zero lamports and no bytes.
export const SetDataFromBufferClosed: Story = {
    args: { ...baseArgs, ix: setDataFromBufferIx({ compression: Compression.Zlib, format: Format.Json }) },
    parameters: {
        accounts: {
            [BUFFER_ADDRESS]: {
                data: {
                    data: { raw: new Uint8Array(0) },
                    executable: false,
                    lamports: 0,
                    owner: PROGRAM_ID,
                    pubkey: new PublicKey(BUFFER_ADDRESS),
                    space: 0,
                },
                status: FetchStatus.Fetched,
            },
        } satisfies State['entries'],
    },
};

// No cache entry at all, and the mock fetcher is a no-op, so the card stays in its reading state.
export const SetDataFromBufferLoading: Story = {
    args: { ...baseArgs, ix: setDataFromBufferIx({ compression: Compression.Zlib, format: Format.Json }) },
};

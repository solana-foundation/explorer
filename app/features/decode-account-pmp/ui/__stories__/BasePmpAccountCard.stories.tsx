import { gen } from '@__fixtures__/gen';
import { decodePmpPayload, PMP_EMPTY_DISCRIMINATOR, readPmpAccountHeader } from '@entities/pmp-account';
import type { Account } from '@providers/accounts';
import type { Address } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import {
    Compression,
    DataSource,
    Encoding,
    Format,
    getBufferEncoder,
    getMetadataEncoder,
    packDirectData,
    PROGRAM_METADATA_PROGRAM_ADDRESS,
} from '@solana-program/program-metadata';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BasePmpAccountCard } from '../BasePmpAccountCard';

const PMP_PROGRAM_ID = new PublicKey(PROGRAM_METADATA_PROGRAM_ADDRESS);
const TARGET_PROGRAM = gen.address(1) as Address;
const AUTHORITY = gen.address(2) as Address;

const IDL_DOC = JSON.stringify({
    instructions: [{ name: 'initialize' }],
    name: 'company_program',
    version: '1.0.0',
});

/** The library's own producer, so every fixture is a byte-exact round trip of what the client puts on chain. */
function pack(content: string, compression: Compression): Uint8Array {
    return packDirectData({ compression, content, encoding: Encoding.Utf8 }).data as Uint8Array;
}

/** Header values as observed on chain: Utf8 / Zlib / Json / Direct, with the real seeds. */
function metadataAccountData(body: Uint8Array, seed = 'idl'): Uint8Array {
    return getMetadataEncoder().encode({
        authority: AUTHORITY,
        canonical: true,
        compression: Compression.Zlib,
        data: body,
        dataLength: body.length,
        dataSource: DataSource.Direct,
        encoding: Encoding.Utf8,
        format: Format.Json,
        mutable: true,
        program: TARGET_PROGRAM,
        seed,
    }) as Uint8Array;
}

function bufferAccountData(body: Uint8Array): Uint8Array {
    return getBufferEncoder().encode({
        authority: AUTHORITY,
        canonical: true,
        data: body,
        program: TARGET_PROGRAM,
        seed: 'security',
    }) as Uint8Array;
}

function toAccount(raw: Uint8Array): Account {
    return {
        data: { raw },
        executable: false,
        lamports: 2_000_000,
        owner: PMP_PROGRAM_ID,
        pubkey: gen.publicKey(3),
        space: raw.length,
    };
}

function toSnapshot(account: Account) {
    return { data: account.data.raw, lamports: account.lamports, owner: account.owner.toBase58() };
}

/**
 * Both data props are pure functions of the account bytes, so each story derives them the same way the card's
 * stateful half does - including decoding the payload from the header's own struct rather than re-reading the
 * account. Only a Metadata account has anything to decode, which is what leaves the rest at `idle`.
 */
function argsFor(raw: Uint8Array) {
    const account = toAccount(raw);
    const header = readPmpAccountHeader({ account: toSnapshot(account) });

    if (header.kind !== 'metadata') {
        return { account, decodedState: { status: 'idle' as const }, header };
    }

    const body = header.account.data.subarray(0, header.account.dataLength);

    return {
        account,
        decodedState: {
            payload: decodePmpPayload({ config: header.account, data: body }),
            status: 'ready' as const,
        },
        header,
    };
}

const meta = {
    component: BasePmpAccountCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/DecodeAccountPmp/BasePmpAccountCard',
} satisfies Meta<typeof BasePmpAccountCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An Empty account is a Buffer whose discriminator byte was flipped, which is what `allocate` leaves behind. */
const EMPTY_ACCOUNT_DATA = (() => {
    const raw = bufferAccountData(new Uint8Array(0));
    raw[0] = PMP_EMPTY_DISCRIMINATOR;
    return raw;
})();

export const MetadataDecoded: Story = {
    args: argsFor(metadataAccountData(pack(IDL_DOC, Compression.Zlib))),
};

/** The frame before the decode effect runs. Effects fire after paint, so this is what a reader actually sees first. */
export const MetadataDecoding: Story = {
    args: { ...argsFor(metadataAccountData(pack(IDL_DOC, Compression.Zlib))), decodedState: { status: 'idle' } },
};

// The account parses fine - it is the CONTENT that is not the Zlib stream its header promises, which is what a
// partially written account looks like.
export const MetadataDecodeFailure: Story = {
    args: argsFor(metadataAccountData(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))),
};

// Four of the six real example accounts are Buffers, so this branch has to read as a deliberate, informative state
// rather than a failure. Named `BufferAccount` so the export does not shadow the global inside this module.
export const BufferAccount: Story = {
    args: argsFor(bufferAccountData(pack(IDL_DOC, Compression.Zlib))),
};

export const EmptyAccount: Story = {
    args: argsFor(EMPTY_ACCOUNT_DATA),
};

/** Shorter than the 96-byte header, which is the shape a reader reaching the URL by hand is most likely to hit. */
export const UnreadableAccount: Story = {
    args: argsFor(new Uint8Array(95)),
};

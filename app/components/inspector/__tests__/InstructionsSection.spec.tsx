/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { gen } from '@__fixtures__/gen';
// From the literal's own library-free module: the feature no longer re-exports it, and this spec only needs the
// program id to build a fixture instruction - not the decoders that `@entities/pmp-account` would pull in.
import { PMP_ADDRESS } from '@entities/pmp-account/lib/program-address';
import { LIGHTHOUSE_ADDRESS } from '@features/decode-instruction-lighthouse';
import { useIdlInstructionDecode } from '@features/decode-instruction-with-idl';
import { getBase58Decoder } from '@solana/kit';
import {
    AddressLookupTableAccount,
    type CompiledInnerInstruction,
    Keypair,
    MessageV0,
    PublicKey,
    TransactionInstruction,
    TransactionMessage,
} from '@solana/web3.js';
import {
    Compression,
    DataSource,
    Encoding,
    Format,
    getAllocateInstructionDataEncoder,
    getSetDataInstructionDataEncoder,
} from '@solana-program/program-metadata';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { readCell, renderWithProviders } from '@/app/__tests__/card-harness';
import { useAddressLookupTables } from '@/app/providers/accounts';
import { FetchStatus } from '@/app/providers/cache';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';

import { InstructionsSection } from '../InstructionsSection';
import { buildMessage, CREATE_ACCOUNT, INNER_INSTRUCTIONS } from './__fixtures__/hoo-611';

// The IDL tiers read through SWR. The mock returns no data, so instructions render through the dispatcher.
vi.mock('swr', () => ({
    __esModule: true,
    default: vi.fn(() => ({
        data: undefined,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
    })),
}));

vi.mock('@features/decode-instruction-with-idl', async importOriginal => ({
    ...(await importOriginal<typeof import('@features/decode-instruction-with-idl')>()),
    useIdlInstructionDecode: vi.fn(() => undefined),
}));

vi.mock('@/app/providers/accounts', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/providers/accounts')>()),
    useAddressLookupTables: vi.fn(() => []),
}));

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

beforeEach(() => {
    vi.mocked(useAddressLookupTables).mockReturnValue([]);
    vi.mocked(useIdlInstructionDecode).mockReturnValue(undefined);
});

describe('Inspector InstructionsSection with a Lighthouse instruction', () => {
    test('should decode and render a Lighthouse instruction via the unified dispatcher', async () => {
        renderSection(buildLighthouseMessage());

        // Title proves the whole path: the dispatcher decoded the raw bytes into
        // `{ program: 'lighthouse', type: 'Assert Sysvar Clock' }` and the
        // `case 'lighthouse'` arm rendered the card.
        expect(await screen.findByText(/Lighthouse: Assert Sysvar Clock/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(readCell('Program')).toMatch(/Lighthouse/);
        });
    });
});

describe('Inspector InstructionsSection with a Program Metadata instruction', () => {
    test('should route an inline setData payload to the PMP card with no IDL resolved', async () => {
        const data = getSetDataInstructionDataEncoder().encode({
            compression: Compression.None,
            data: new TextEncoder().encode('{"name":"company","version":"1.0.0"}'),
            dataSource: DataSource.Direct,
            encoding: Encoding.Utf8,
            format: Format.Json,
        }) as Uint8Array;

        renderSection(buildPmpMessage(data));

        expect(await screen.findByText(/ProgramMetadata: SetData/i)).toBeInTheDocument();
    });

    test('should leave a housekeeping instruction to the existing tiers', async () => {
        const data = getAllocateInstructionDataEncoder().encode({ seed: 'idl' }) as Uint8Array;

        renderSection(buildPmpMessage(data));

        expect(await screen.findAllByText(/Program Metadata Program/i)).not.toHaveLength(0);
        expect(screen.queryByTestId('pmp-payload-section')).not.toBeInTheDocument();
    });
});

describe('Inspector InstructionsSection with address lookup tables', () => {
    test('should report the table it could not fetch', () => {
        vi.mocked(useAddressLookupTables).mockReturnValue([[undefined, FetchStatus.FetchFailed]]);

        renderSection(buildLookupMessage());

        expect(screen.getByText(`Failed to fetch address lookup table: ${TABLE_KEY.toBase58()}`)).toBeInTheDocument();
    });

    test('should decompile through a resolved table, and only once it resolves', () => {
        vi.mocked(useAddressLookupTables).mockReturnValue([undefined]);
        const { rerender } = renderSection(buildLookupMessage());
        expect(screen.getByText(/Loading/)).toBeInTheDocument();
        expect(screen.queryByText('#1')).not.toBeInTheDocument();

        vi.mocked(useAddressLookupTables).mockReturnValue([[lookupTable(), FetchStatus.Fetched]]);
        rerender(<InstructionsSection message={buildLookupMessage()} />);

        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.queryByText(/Failed to fetch address lookup table/)).not.toBeInTheDocument();
    });
});

describe('Inspector InstructionsSection with inner instructions', () => {
    afterEach(() => {
        vi.mocked(useIdlInstructionDecode).mockReturnValue(undefined);
    });

    test('should render a card per inner instruction under its parent', async () => {
        const { container } = renderSection(buildMessage(), INNER_INSTRUCTIONS);

        // The header is only rendered when the parent has inner instruction cards.
        expect(await screen.findByText(/Inner Instructions/i)).toBeInTheDocument();

        const rendered = container.textContent ?? '';
        expect(rendered).toContain('#1.1');
        expect(rendered).toContain('#1.2');
        expect(rendered).toContain('#1.3');
        expect(rendered).toContain('#1.4');

        // The three Token CPIs render as raw cards because the IDL decoder is mocked to return
        // undefined and the dispatcher does not parse those discriminators.
        expect(await screen.findByText(/System Program: Create Account/i)).toBeInTheDocument();
    });

    test('should render an inner token batch as a batch card, not through the IDL decoder', async () => {
        // On mainnet the Token program has an IDL. The IDL decoder returns `{ kind: 'unknown' }`,
        // not `undefined`, when the IDL does not declare the discriminator.
        // The batch card must still render.
        vi.mocked(useIdlInstructionDecode).mockReturnValue({ kind: 'unknown' });

        renderSection(buildMessage(), INNER_BATCH);

        const title = await screen.findByText(/Token Program: Batch \(1 instruction\)/i);

        // The badge is in the same element as the title, so this asserts the batch card's own number.
        // eslint-disable-next-line testing-library/no-node-access -- the badge's card is what is under test
        expect(title.parentElement).toHaveTextContent('#1.1');
    });

    test.each([
        { inner: INNER_ZK_CLOSE_CONTEXT_STATE, title: /ZK ElGamal Proof Program: Close Context State/i },
        { inner: INNER_PYTH_INIT_MAPPING, title: /Pyth: Init Mapping Account/i },
        { inner: INNER_COMPUTE_BUDGET_SET_LIMIT, title: /Compute Budget Program: Set Compute Unit Limit/i },
        { inner: INNER_MEMO, title: /Memo Program: Memo/i },
        { inner: INNER_ALT_FREEZE, title: /Address Lookup Table: Freeze Lookup Table/i },
    ])('should number an inner $title card under its parent', async ({ inner, title }) => {
        renderSection(buildMessage(), inner);

        const card = await screen.findByText(title);

        // eslint-disable-next-line testing-library/no-node-access -- the badge's card is what is under test
        expect(card.parentElement).toHaveTextContent('#1.2');
    });

    test('should number and anchor a child it cannot decompile so the siblings keep their positions', async () => {
        renderSection(buildMessage(), INNER_WITH_BAD_ACCOUNT);

        expect(await screen.findByText(/Could not display instruction #1\.2, please report/i)).toBeInTheDocument();

        const rendered = document.body.textContent ?? '';
        expect(rendered).toContain('#1.1');
        expect(rendered).toContain('#1.3');
        /* eslint-disable testing-library/no-node-access -- the anchor id is what is under test */
        expect(document.getElementById('ix-1-1')).not.toBeNull();
        expect(document.getElementById('ix-1-2')).not.toBeNull();
        expect(document.getElementById('ix-1-3')).not.toBeNull();
        /* eslint-enable testing-library/no-node-access */
    });

    test('should render the curated card when the IDL declares nothing for the instruction', async () => {
        vi.mocked(useIdlInstructionDecode).mockReturnValue({ kind: 'unknown' });

        renderSection(buildMessage());

        expect(await screen.findByText(/Create Idempotent/i)).toBeInTheDocument();
    });

    test('should pass the same instructions to the IDL decoder across a re-render', async () => {
        const message = buildMessage();
        const section = <InstructionsSection message={message} compiledInnerInstructions={INNER_INSTRUCTIONS} />;

        const { rerender } = renderWithProviders(section, { dispatcher: instructionParserDispatcher });
        await screen.findByText(/Inner Instructions/i);

        vi.mocked(useIdlInstructionDecode).mockClear();
        rerender(<InstructionsSection message={message} compiledInnerInstructions={INNER_INSTRUCTIONS} />);
        const first = vi.mocked(useIdlInstructionDecode).mock.calls.map(call => call[0].raw);
        vi.mocked(useIdlInstructionDecode).mockClear();
        rerender(<InstructionsSection message={message} compiledInnerInstructions={INNER_INSTRUCTIONS} />);
        const second = vi.mocked(useIdlInstructionDecode).mock.calls.map(call => call[0].raw);

        expect(first).toHaveLength(5);
        expect(second.every((raw, position) => raw === first[position])).toBe(true);
    });

    test('should render no inner cards when the transaction carries no metadata', async () => {
        renderSection(buildMessage());

        expect(await screen.findByText(/Create Idempotent/i)).toBeInTheDocument();
        expect(screen.queryByText(/Inner Instructions/i)).not.toBeInTheDocument();
    });
});

function renderSection(message: MessageV0, compiledInnerInstructions?: CompiledInnerInstruction[]) {
    return renderWithProviders(
        <InstructionsSection message={message} compiledInnerInstructions={compiledInnerInstructions} />,
        { dispatcher: instructionParserDispatcher },
    );
}

// A single-instruction v0 message carrying the "Assert Sysvar Clock" bytes
// (same fixture as the parser/card tests). No address-table lookups, so the
// inspector decompiles it without hydrating any tables.
function buildLighthouseMessage(): MessageV0 {
    const ix = new TransactionInstruction({
        data: Buffer.from([15, 0, 0, 166, 238, 134, 18, 0, 0, 0, 0, 3]),
        keys: [],
        programId: new PublicKey(LIGHTHOUSE_ADDRESS),
    });
    return new TransactionMessage({
        instructions: [ix],
        payerKey: Keypair.generate().publicKey,
        recentBlockhash: PublicKey.default.toBase58(),
    }).compileToV0Message();
}

function buildPmpMessage(data: Uint8Array): MessageV0 {
    const ix = new TransactionInstruction({
        data: Buffer.from(data),
        keys: [
            { isSigner: false, isWritable: true, pubkey: gen.publicKey(2) },
            { isSigner: false, isWritable: false, pubkey: gen.publicKey(3) },
        ],
        programId: new PublicKey(PMP_ADDRESS),
    });
    return new TransactionMessage({
        instructions: [ix],
        payerKey: gen.publicKey(0),
        recentBlockhash: PublicKey.default.toBase58(),
    }).compileToV0Message();
}

const TABLE_KEY = new PublicKey('4aa42XQFo45wc2PHQH21vahuyuFYCEZAH4G27xpGYqf6');

function lookupTable(): AddressLookupTableAccount {
    return new AddressLookupTableAccount({
        key: TABLE_KEY,
        state: {
            addresses: [Keypair.generate().publicKey],
            authority: undefined,
            deactivationSlot: BigInt('18446744073709551615'),
            lastExtendedSlot: 372_654_321,
            lastExtendedSlotStartIndex: 0,
        },
    });
}

// A one-instruction Memo message whose second account comes from the lookup table.
function buildLookupMessage(): MessageV0 {
    return new MessageV0({
        addressTableLookups: [{ accountKey: TABLE_KEY, readonlyIndexes: [], writableIndexes: [0] }],
        compiledInstructions: [{ accountKeyIndexes: [0, 2], data: new Uint8Array([104, 105]), programIdIndex: 1 }],
        header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 1, numRequiredSignatures: 1 },
        recentBlockhash: new PublicKey(new Uint8Array(32)).toBase58(),
        staticAccountKeys: [
            new PublicKey('37vWB5RfLRpnhNobhzmwCRGZbynGd4je2NvppSjUsEdJ'),
            new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        ],
    });
}

// One Token program inner instruction with the batch discriminator (255). It contains a single
// Transfer of 100 over three accounts: source, destination, authority.
const INNER_BATCH: CompiledInnerInstruction[] = [
    {
        index: 0,
        instructions: [
            {
                accounts: [1, 2, 0],
                data: encodeBase58([255, 3, 9, 3, 100, 0, 0, 0, 0, 0, 0, 0]),
                programIdIndex: 6,
            },
        ],
    },
];

// A System CreateAccount followed by a ZK ElGamal Proof Close Context State (discriminator 0) over
// context state, destination, authority.
const INNER_ZK_CLOSE_CONTEXT_STATE = afterCreateAccount({
    accounts: [1, 2, 0],
    data: encodeBase58([0]),
    programIdIndex: 9,
});

// A System CreateAccount followed by a Pyth Init Mapping: header version 2, instruction index 0,
// over funding and mapping accounts.
const INNER_PYTH_INIT_MAPPING = afterCreateAccount({
    accounts: [0, 1],
    data: encodeBase58([2, 0, 0, 0, 0, 0, 0, 0]),
    programIdIndex: 10,
});

// A System CreateAccount followed by a Compute Budget SetComputeUnitLimit: discriminator 2, u32 limit 200_000.
const INNER_COMPUTE_BUDGET_SET_LIMIT = afterCreateAccount({
    accounts: [],
    data: encodeBase58([2, 64, 13, 3, 0]),
    programIdIndex: 5,
});

// A System CreateAccount followed by a Memo whose data is the UTF-8 text "hi".
const INNER_MEMO = afterCreateAccount({ accounts: [0], data: encodeBase58([104, 105]), programIdIndex: 11 });

// A System CreateAccount followed by an Address Lookup Table Freeze: u32 discriminator 1, over
// the table and its authority.
const INNER_ALT_FREEZE = afterCreateAccount({ accounts: [1, 0], data: encodeBase58([1, 0, 0, 0]), programIdIndex: 12 });

// Three CPIs. The middle one names an account index the message does not have.
const INNER_WITH_BAD_ACCOUNT: CompiledInnerInstruction[] = [
    {
        index: 0,
        instructions: [
            { accounts: [4], data: '84eT', programIdIndex: 6 },
            { accounts: [0, 99], data: 'P', programIdIndex: 6 },
            CREATE_ACCOUNT,
        ],
    },
];

function afterCreateAccount(instruction: CompiledInnerInstruction['instructions'][number]): CompiledInnerInstruction[] {
    return [{ index: 0, instructions: [CREATE_ACCOUNT, instruction] }];
}

function encodeBase58(bytes: number[]): string {
    return getBase58Decoder().decode(new Uint8Array(bytes));
}

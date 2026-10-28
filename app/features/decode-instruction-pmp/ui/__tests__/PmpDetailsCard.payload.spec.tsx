/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { gen } from '@__fixtures__/gen';
import { type InstructionSurface, InstructionSurfaceProvider, toRawInstructionNode } from '@entities/instruction-card';
import {
    decodePmpPayload,
    PMP_MAX_UNPACKED_BYTES,
    PMP_POINTER_HASH_NOTES,
    type PmpPayloadDecodeResult,
} from '@entities/pmp-account';
import { bufferAccountData, DOC, pack } from '@entities/pmp-account/__fixtures__/pmp-account';
import type { Account } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { address } from '@solana/kit';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { Compression, DataSource, Encoding, Format } from '@solana-program/program-metadata';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { findCell } from '@/app/__tests__/card-harness';
import { trackEvent } from '@/app/shared/lib/analytics';
import { fromUtf8 } from '@/app/shared/lib/bytes';
import { sha256Hex } from '@/app/shared/lib/hash';

import { PMP_ADDRESS } from '../../lib/constants';
import { decodePmpContentInstruction } from '../../lib/decode-pmp-instruction';
import type { PmpPayload, PmpPayloadInstruction } from '../../lib/types';
import { PmpDetailsCard } from '../PmpDetailsCard';

vi.mock('@/app/shared/lib/analytics', () => ({ trackEvent: vi.fn() }));

// The card decodes its instruction first, so each test hands the card the decode it renders.
vi.mock('../../lib/decode-pmp-instruction', () => ({ decodePmpContentInstruction: vi.fn() }));

// Partial: the real decoder runs unless a test stubs a result that only a large buffer would reach.
vi.mock('@entities/pmp-account', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/pmp-account')>();
    return { ...actual, decodePmpPayload: vi.fn(actual.decodePmpPayload) };
});

// The on-demand account read goes through the shared accounts provider, so the card is exercised against a
// controllable cache entry rather than a live RPC.
const { mockFetchAccountInfo, mockUseAccountInfo } = vi.hoisted(() => ({
    mockFetchAccountInfo: vi.fn(),
    mockUseAccountInfo: vi.fn(),
}));

vi.mock('@providers/accounts', () => ({
    useAccountInfo: mockUseAccountInfo,
    useFetchAccountInfo: () => mockFetchAccountInfo,
}));

vi.mock('@/app/components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: { toBase58(): string } }) => <div>{pubkey.toBase58()}</div>,
}));

const STUB_SURFACE: InstructionSurface = {
    Card: () => undefined,
    collapsible: false,
    instructionData: () => undefined,
    rawInstructions: undefined,
    result: { err: null },
    signature: undefined,
    validateProgram: false,
};

const NODE = toRawInstructionNode({
    index: 0,
    ix: new TransactionInstruction({ data: Buffer.alloc(0), keys: [], programId: new PublicKey(PMP_ADDRESS) }),
});

function inline(bytes: Uint8Array, dataSource: DataSource): PmpPayload {
    return { dataSource, source: { bytes, kind: 'inline' } };
}

function renderCard(pmpIx: PmpPayloadInstruction) {
    vi.mocked(decodePmpContentInstruction).mockReturnValue(pmpIx);
    return render(
        <InstructionSurfaceProvider surface={STUB_SURFACE}>
            <PmpDetailsCard node={NODE} fallback={undefined} />
        </InstructionSurfaceProvider>,
    );
}

const JSON_CONFIG = { compression: Compression.None, encoding: Encoding.Utf8, format: Format.Json };

const BUFFER_ADDRESS = address(gen.address(1));
const METADATA_ADDRESS = address(gen.address(2));

/** A `setData` whose bytes live in a foreign buffer, which is the shape that offers the account read. */
const DEFERRED_SET_DATA: PmpPayloadInstruction = {
    config: JSON_CONFIG,
    kind: 'setData',
    payload: { dataSource: DataSource.Direct, source: { account: BUFFER_ADDRESS, kind: 'account' } },
};

function fetchedEntry(raw: Uint8Array | undefined, overrides: { lamports?: number; owner?: string } = {}) {
    const data: Account = {
        data: { raw },
        executable: false,
        lamports: overrides.lamports ?? 1_000_000,
        owner: new PublicKey(overrides.owner ?? PMP_ADDRESS),
        pubkey: new PublicKey(BUFFER_ADDRESS),
    };
    return { data, status: FetchStatus.Fetched };
}

const OVERSIZED = {
    budget: 1024,
    bytes: new Uint8Array(1025),
    dataHash: 'f'.repeat(64),
    kind: 'oversized',
} satisfies PmpPayloadDecodeResult;

/**
 * The payload opens on the Raw tab and Radix unmounts the inactive panel, so nothing decoded is in the DOM until
 * the reader switches. Every assertion about decoded content has to go through this first.
 */
async function openDecodedTab() {
    await userEvent.click(screen.getByRole('tab', { name: 'Decoded' }));
}

function decodedPanel() {
    return screen.getByRole('tabpanel', { name: 'Decoded' });
}

function rawPanel() {
    return screen.getByRole('tabpanel', { name: 'Raw' });
}

describe('PmpDetailsCard payload', () => {
    beforeEach(() => {
        vi.mocked(trackEvent).mockClear();
        vi.mocked(decodePmpPayload).mockReset();
        mockFetchAccountInfo.mockClear();
        // Nothing in the cache, which is the state every test starts from - a test that needs a resolved read
        // sets its own return value.
        mockUseAccountInfo.mockReset().mockReturnValue(undefined);
    });

    it('should render an inline Direct JSON payload as a pretty-printed document', async () => {
        renderCard({
            config: JSON_CONFIG,
            kind: 'setData',
            payload: inline(pack(DOC, Compression.None), DataSource.Direct),
        });
        await openDecodedTab();

        const decoded = decodedPanel();
        expect(decoded).toHaveTextContent('company');
        expect(decoded).toHaveTextContent('1.0.0');
        // Pretty-printed rather than echoed back verbatim, which is what separates a parsed document from the
        // verbatim-text fallback a Json payload lands on when its bytes do not parse.
        expect(decoded.textContent).toContain('\n  "name": "company"');
        expect(findCell('Data Hash')).toHaveTextContent(sha256Hex(fromUtf8(DOC)));
    });

    it('should also offer the raw encoded bytes on a Raw tab', async () => {
        renderCard({
            config: JSON_CONFIG,
            kind: 'setData',
            payload: inline(new Uint8Array([0xde, 0xad, 0xbe, 0xef]), DataSource.Direct),
        });

        await userEvent.click(screen.getByRole('tab', { name: 'Raw' }));

        // RawDataField owns the hex grid and the byte count, so asserting on them proves it is wired up.
        const raw = rawPanel();
        expect(raw).toHaveTextContent('de ad be ef');
        expect(raw).toHaveTextContent('4 bytes');
        expect(screen.getByRole('tab', { name: 'Hex' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Base64' })).toBeInTheDocument();
    });

    it('should decompress a Zlib payload before rendering it', async () => {
        renderCard({
            config: { compression: Compression.Zlib, encoding: Encoding.Utf8, format: Format.Json },
            kind: 'setData',
            payload: inline(pack(DOC, Compression.Zlib), DataSource.Direct),
        });
        await openDecodedTab();

        expect(decodedPanel()).toHaveTextContent('1.0.0');
    });

    it('should render a Yaml payload as verbatim text rather than as a parsed document', async () => {
        renderCard({
            config: { compression: Compression.None, encoding: Encoding.Utf8, format: Format.Yaml },
            kind: 'setData',
            payload: inline(pack('name: company\n', Compression.None), DataSource.Direct),
        });
        await openDecodedTab();

        expect(decodedPanel()).toHaveTextContent('name: company');
    });

    it('should render an Encoding None payload as hex text rather than as characters', async () => {
        renderCard({
            config: { compression: Compression.None, encoding: Encoding.None, format: Format.None },
            kind: 'setData',
            payload: inline(new Uint8Array([0xde, 0xad, 0xbe, 0xef]), DataSource.Direct),
        });
        await openDecodedTab();

        expect(decodedPanel()).toHaveTextContent('deadbeef');
    });

    it('should render a Json-hinted payload that does not parse as verbatim text', async () => {
        renderCard({
            config: JSON_CONFIG,
            kind: 'setData',
            payload: inline(pack('{not json', Compression.None), DataSource.Direct),
        });
        await openDecodedTab();

        expect(decodedPanel()).toHaveTextContent('{not json');
    });

    it('should state that a header-only setData carries no new payload without surfacing a decode failure', () => {
        renderCard({ config: JSON_CONFIG, kind: 'setData' });

        expect(screen.getByText('This instruction carries no payload bytes.')).toBeInTheDocument();
        expect(screen.queryByText(/Could not decode this payload/)).not.toBeInTheDocument();
        expect(screen.queryByRole('tab', { name: 'Decoded' })).not.toBeInTheDocument();
        expect(findCell('Data Hash')).toBeUndefined();
    });

    it('should state that a setData naming no source account carries no payload rather than read an account', () => {
        renderCard({
            config: JSON_CONFIG,
            kind: 'setData',
            payload: { dataSource: DataSource.Direct, source: { kind: 'absent' } },
        });

        expect(screen.getByText('This instruction carries no payload bytes.')).toBeInTheDocument();
        expect(screen.queryByText('Reading account...')).not.toBeInTheDocument();
        expect(mockFetchAccountInfo).not.toHaveBeenCalled();
    });

    it('should show the source buffer account when setData carries no inline payload', () => {
        renderCard({
            config: JSON_CONFIG,
            kind: 'setData',
            payload: { dataSource: DataSource.Direct, source: { account: BUFFER_ADDRESS, kind: 'account' } },
        });

        expect(findCell('Source buffer account')).toHaveTextContent(BUFFER_ADDRESS);
    });

    it('should show the metadata account when initialize is the in-place shape', () => {
        renderCard({
            config: JSON_CONFIG,
            kind: 'initialize',
            payload: { dataSource: DataSource.Direct, source: { account: METADATA_ADDRESS, kind: 'account' } },
            seed: 'idl',
        });

        expect(findCell('Metadata account')).toHaveTextContent(METADATA_ADDRESS);
    });

    it('should render an External payload through the same tabs, opening on the raw bytes', () => {
        renderCard({
            config: JSON_CONFIG,
            kind: 'setData',
            payload: inline(new Uint8Array(40), DataSource.External),
        });

        // A non-Direct source gets no special-cased note in the bytes view: the card's `Data Source` argument row
        // already names it, so the tabs stay a plain bytes view rather than repeating the same fact.
        expect(rawPanel()).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Decoded' })).toBeInTheDocument();
        expect(screen.queryByRole('tabpanel', { name: 'Decoded' })).not.toBeInTheDocument();
    });

    it('should report why an External payload has no data hash instead of hashing its pointer bytes', () => {
        renderCard({
            config: JSON_CONFIG,
            kind: 'setData',
            payload: inline(new Uint8Array(40), DataSource.External),
        });

        expect(findCell('Data Hash')).toHaveTextContent(PMP_POINTER_HASH_NOTES[DataSource.External]);
    });

    it('should report why a Url payload has no data hash instead of hashing its pointer bytes', () => {
        const url = 'https://example.com/idl.json';
        renderCard({
            config: JSON_CONFIG,
            kind: 'setData',
            payload: inline(new TextEncoder().encode(url), DataSource.Url),
        });

        expect(findCell('Data Hash')).toHaveTextContent(PMP_POINTER_HASH_NOTES[DataSource.Url]);
        expect(findCell('Data Hash')).not.toHaveTextContent(sha256Hex(fromUtf8(url)));
    });

    it('should render a Url payload pointer as decoded text without resolving it', async () => {
        renderCard({
            config: JSON_CONFIG,
            kind: 'setData',
            payload: inline(new TextEncoder().encode('https://example.com/idl.json'), DataSource.Url),
        });
        await openDecodedTab();

        // The decoded panel applies the instruction's own hints to the POINTER bytes - a local decode, not
        // resolution. For a Url payload that is the URL text itself, and nothing is fetched or linked.
        expect(decodedPanel()).toHaveTextContent('https://example.com/idl.json');
        expect(within(decodedPanel()).queryByRole('link')).not.toBeInTheDocument();
    });

    it('should fall back to the raw view with an inline error note when the payload fails to decode', async () => {
        renderCard({
            config: { compression: Compression.Zlib, encoding: Encoding.Utf8, format: Format.Json },
            kind: 'setData',
            payload: inline(new Uint8Array([1, 2, 3, 4]), DataSource.Direct),
        });
        await openDecodedTab();

        // The note is the whole panel, so no decoded document renders beside it.
        expect(decodedPanel()).toHaveTextContent(/^Could not decode this payload: .*incorrect header check$/);
        // The failed panel repeats no raw view of its own - Raw is a sibling tab, so the bytes stay one click away.
        // Assert the escape hatch is still reachable rather than that it is mounted right now.
        expect(screen.getByRole('tab', { name: 'Raw' })).toBeInTheDocument();
        expect(findCell('Data Hash')).toBeUndefined();
    });

    it('should render a bounded view with the byte count and a download when the payload exceeds the cap', async () => {
        vi.mocked(decodePmpPayload).mockReturnValue(OVERSIZED);
        renderCard({
            config: JSON_CONFIG,
            kind: 'setData',
            payload: inline(new Uint8Array(64), DataSource.Direct),
        });
        await openDecodedTab();

        const oversized = decodedPanel();
        expect(oversized).toHaveTextContent(/too large/i);
        // The DECOMPRESSED size, which is what the cap is measured on, not the stored size.
        expect(oversized).toHaveTextContent(`${OVERSIZED.bytes.length} bytes, limit ${OVERSIZED.budget}`);
        expect(oversized).toHaveTextContent(/use download\/copy/i);
        expect(screen.getByLabelText('Download')).toBeInTheDocument();
    });

    it('should report both the unpacked and the stored size when an oversized payload was compressed', async () => {
        const stored = new Uint8Array(64);
        vi.mocked(decodePmpPayload).mockReturnValue(OVERSIZED);
        renderCard({
            config: { compression: Compression.Gzip, encoding: Encoding.Utf8, format: Format.Json },
            kind: 'setData',
            payload: inline(stored, DataSource.Direct),
        });
        await openDecodedTab();

        expect(decodedPanel()).toHaveTextContent(
            `${OVERSIZED.bytes.length} bytes unpacked from ${stored.length} stored`,
        );
        expect(within(decodedPanel()).getByText('uncompressed')).toBeInTheDocument();
    });

    it('should badge the Raw tab of a compressed payload with the compression it is still in', async () => {
        renderCard({
            config: { compression: Compression.Gzip, encoding: Encoding.Utf8, format: Format.Json },
            kind: 'setData',
            payload: inline(pack(DOC, Compression.Gzip), DataSource.Direct),
        });

        await userEvent.click(screen.getByRole('tab', { name: 'Raw' }));

        expect(within(rawPanel()).getByText('gzip')).toBeInTheDocument();
    });

    it('should badge a Zlib payload as zlib rather than as gzip', async () => {
        renderCard({
            config: { compression: Compression.Zlib, encoding: Encoding.Utf8, format: Format.Json },
            kind: 'setData',
            payload: inline(pack(DOC, Compression.Zlib), DataSource.Direct),
        });

        await userEvent.click(screen.getByRole('tab', { name: 'Raw' }));

        expect(within(rawPanel()).getByText('zlib')).toBeInTheDocument();
    });

    it('should badge no tab of an uncompressed payload', async () => {
        renderCard({
            config: JSON_CONFIG,
            kind: 'setData',
            payload: inline(pack(DOC, Compression.None), DataSource.Direct),
        });

        await userEvent.click(screen.getByRole('tab', { name: 'Raw' }));

        // Nothing was unpacked, so the Raw tab's count IS the payload length and there is no distinction to mark.
        expect(within(rawPanel()).queryByText(/^(gzip|zlib)$/)).not.toBeInTheDocument();
    });

    it('should promise no download when the payload expands past the unpack limit', async () => {
        // What separates this from `oversized`: the unpack was abandoned, so no decompressed bytes exist to copy or
        // download. The panel must not offer an affordance it cannot honour.
        vi.mocked(decodePmpPayload).mockReturnValue({ kind: 'unpack-overflow', limit: PMP_MAX_UNPACKED_BYTES });
        renderCard({
            config: { compression: Compression.Gzip, encoding: Encoding.Utf8, format: Format.Json },
            kind: 'setData',
            payload: inline(new Uint8Array(64), DataSource.Direct),
        });
        await openDecodedTab();

        expect(decodedPanel()).toHaveTextContent(/limit for unpacking/i);
        expect(decodedPanel()).not.toHaveTextContent(/too large/i);
        // Radix unmounts the inactive panel, so the Raw tab's own download is not in the DOM either - the only
        // Download control that could match here would be one this panel rendered, and it must not render one.
        expect(screen.queryByLabelText('Download')).not.toBeInTheDocument();
    });

    it('should emit a tab analytics event when the reader opens the decoded tab', async () => {
        renderCard({
            config: JSON_CONFIG,
            kind: 'setData',
            payload: inline(pack(DOC, Compression.None), DataSource.Direct),
        });

        await userEvent.click(screen.getByRole('tab', { name: 'Decoded' }));

        expect(trackEvent).toHaveBeenCalledWith('pmp_data_tab_opened', {
            data_source: 'direct',
            format: 'json',
            instruction: 'set_data',
            source: 'instruction',
            tab: 'decoded',
        });
    });

    it('should carry the data source when the tabs render for a non-Direct payload', async () => {
        renderCard({
            config: JSON_CONFIG,
            kind: 'setData',
            payload: inline(new TextEncoder().encode('https://example.com/idl.json'), DataSource.Url),
        });

        await userEvent.click(screen.getByRole('tab', { name: 'Decoded' }));

        expect(trackEvent).toHaveBeenCalledWith(
            'pmp_data_tab_opened',
            expect.objectContaining({ data_source: 'url', tab: 'decoded' }),
        );
    });

    it('should emit no analytics event on mount, before any tab is clicked', () => {
        renderCard({
            config: JSON_CONFIG,
            kind: 'setData',
            payload: inline(pack(DOC, Compression.None), DataSource.Direct),
        });

        // The default panel must not count as an interaction, or every rendered card inflates the tab counts.
        expect(trackEvent).not.toHaveBeenCalled();
    });

    it('should emit no analytics event when there are no tabs to click', () => {
        renderCard({ config: JSON_CONFIG, kind: 'setData' });

        expect(trackEvent).not.toHaveBeenCalled();
    });

    it('should read the referenced account on render, as raw bytes', () => {
        renderCard(DEFERRED_SET_DATA);

        expect(mockFetchAccountInfo).toHaveBeenCalledTimes(1);
        const [pubkey, dataMode] = mockFetchAccountInfo.mock.calls[0];
        expect(pubkey.toBase58()).toBe(BUFFER_ADDRESS);
        // `raw` and not `parsed`: the provider only keeps raw bytes for accounts it could not parse natively, and
        // a PMP buffer has to arrive as bytes for the generated decoder to see its header at all.
        expect(dataMode).toBe('raw');
        expect(screen.getByText('Reading account...')).toBeInTheDocument();
    });

    it('should decode the referenced buffer content once the read resolves', async () => {
        mockUseAccountInfo.mockReturnValue(fetchedEntry(bufferAccountData(pack(DOC, Compression.None))));
        renderCard(DEFERRED_SET_DATA);
        await openDecodedTab();

        expect(decodedPanel()).toHaveTextContent('"name": "company"');
        expect(screen.getByRole('tab', { name: 'Raw' })).toBeInTheDocument();
    });

    it('should render the data hash row on the source-account path too', () => {
        mockUseAccountInfo.mockReturnValue(fetchedEntry(bufferAccountData(pack(DOC, Compression.None))));
        renderCard(DEFERRED_SET_DATA);

        expect(findCell('Data Hash')).toHaveTextContent(sha256Hex(fromUtf8(DOC)));
    });

    it('should say the payload is empty rather than render a blank document', async () => {
        // `allocate` with no `write` yet leaves a live 96-byte buffer: header, no body. Every encoding decodes zero
        // bytes to the empty string, so the Decoded panel used to hold an empty `pre` that looked like a document
        // the reader had to scroll for. Lamports are non-zero, so this is NOT the closed-account shape.
        mockUseAccountInfo.mockReturnValue(fetchedEntry(bufferAccountData(new Uint8Array(0))));
        renderCard(DEFERRED_SET_DATA);
        await openDecodedTab();

        expect(decodedPanel()).toHaveTextContent(/^The payload is empty\.$/);
        expect(screen.queryByText(/does not exist on chain/)).not.toBeInTheDocument();
    });

    it('should say the account is gone rather than fail when the buffer was closed', () => {
        // The provider's closed-account shape, and the common outcome on a historical setData: the client closes
        // the source buffer in the same flow to reclaim its rent.
        mockUseAccountInfo.mockReturnValue(fetchedEntry(new Uint8Array(0), { lamports: 0 }));
        renderCard(DEFERRED_SET_DATA);

        expect(screen.getByText(/does not exist on chain/i)).toBeInTheDocument();
        expect(screen.queryByText(/Could not read account content/)).not.toBeInTheDocument();
    });

    it('should say the referenced account is unwritten rather than warn that it cannot be read', () => {
        // A PMP-owned account still carrying the Empty discriminator: created, never `allocate`d. `readPmpAccount`
        // calls that ordinary, so `decodePmpAccount` passes it through instead of demoting it to `unreadable`.
        const unwritten = bufferAccountData(new Uint8Array(0));
        unwritten[0] = 0; // AccountDiscriminator.Empty
        mockUseAccountInfo.mockReturnValue(fetchedEntry(unwritten));
        renderCard(DEFERRED_SET_DATA);

        expect(screen.getByText(/has not been written yet/i)).toBeInTheDocument();
        expect(screen.queryByText(/Could not read account content/)).not.toBeInTheDocument();
    });

    it('should warn when the referenced account is not owned by the Program Metadata Program', () => {
        mockUseAccountInfo.mockReturnValue(
            fetchedEntry(bufferAccountData(pack(DOC, Compression.None)), { owner: BUFFER_ADDRESS }),
        );
        renderCard(DEFERRED_SET_DATA);

        expect(screen.getByText(/Could not read account content/)).toHaveTextContent(BUFFER_ADDRESS);
        expect(screen.queryByRole('tab', { name: 'Decoded' })).not.toBeInTheDocument();
    });

    it('should request the bytes when the cached entry was fetched without them', () => {
        // The inspector fetches every account in the message in `skip` mode (`AddressWithContext`), which caches
        // the account with no bytes under the same key this hook reads. Decoding that entry reported a live
        // buffer as "shorter than the 96-byte header", intermittently, depending on which fetch settled last.
        mockUseAccountInfo.mockReturnValue(fetchedEntry(undefined, { lamports: 2_000_000 }));
        renderCard(DEFERRED_SET_DATA);

        expect(mockFetchAccountInfo).toHaveBeenCalledTimes(1);
        expect(mockFetchAccountInfo.mock.calls[0][1]).toBe('raw');
        expect(screen.getByText('Reading account...')).toBeInTheDocument();
        expect(screen.queryByText(/Could not read account content/)).not.toBeInTheDocument();
    });

    it('should surface an RPC failure as its own state', () => {
        mockUseAccountInfo.mockReturnValue({ status: FetchStatus.FetchFailed });
        renderCard(DEFERRED_SET_DATA);

        expect(screen.getByText(/The RPC request failed/)).toBeInTheDocument();
    });

    it('should mark a tab switch on account content as its own source', async () => {
        mockUseAccountInfo.mockReturnValue(fetchedEntry(bufferAccountData(pack(DOC, Compression.None))));
        renderCard(DEFERRED_SET_DATA);

        await openDecodedTab();

        // Without `source` the account panel's switches would be indistinguishable from the inline panel's.
        expect(trackEvent).toHaveBeenCalledWith(
            'pmp_data_tab_opened',
            expect.objectContaining({ source: 'account', tab: 'decoded' }),
        );
    });
});

/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { gen } from '@__fixtures__/gen';
import type { Account } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import type { Address } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import {
    Compression,
    DataSource,
    Encoding,
    Format,
    getBufferEncoder,
    packDirectData,
} from '@solana-program/program-metadata';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { gzip } from 'pako';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { trackEvent } from '@/app/shared/lib/analytics';

import { PMP_ADDRESS } from '../../lib/constants';
import type { PmpPayloadInstruction } from '../../lib/types';
import { DataPayloadSection } from '../DataPayloadSection';

vi.mock('@/app/shared/lib/analytics', () => ({ trackEvent: vi.fn() }));

// The on-demand account read goes through the shared accounts provider, so the section is exercised against a
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
    Address: ({ pubkey }: { pubkey: { toBase58(): string } }) => <div data-testid="address">{pubkey.toBase58()}</div>,
}));

const DOC = '{"name":"company","version":"1.0.0"}';

function pack(content: string, compression: Compression): Uint8Array {
    return packDirectData({ compression, content, encoding: Encoding.Utf8 }).data as Uint8Array;
}

function renderSection(content: PmpPayloadInstruction, cap?: number) {
    return render(
        <table>
            <tbody>
                <DataPayloadSection content={content} cap={cap} />
            </tbody>
        </table>,
    );
}

const JSON_CONFIG = { compression: Compression.None, encoding: Encoding.Utf8, format: Format.Json };

const BUFFER_ADDRESS = gen.address(1);
const METADATA_ADDRESS = gen.address(2);

/** A `setData` whose bytes live in a foreign buffer, which is the shape that offers the account read. */
const DEFERRED_SET_DATA: PmpPayloadInstruction = {
    config: JSON_CONFIG,
    dataSource: DataSource.Direct,
    kind: 'setData',
    sourceBuffer: BUFFER_ADDRESS,
};

/** The library's own encoder, so the fixture carries the real 96-byte Buffer header. */
function bufferAccountData(body: Uint8Array): Uint8Array {
    return getBufferEncoder().encode({
        authority: BUFFER_ADDRESS as Address,
        canonical: true,
        data: body,
        program: BUFFER_ADDRESS as Address,
        seed: 'idl',
    }) as Uint8Array;
}

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

/**
 * The section opens on the Raw tab and Radix unmounts the inactive panel, so nothing decoded is in the DOM until
 * the reader switches. Every assertion about decoded content has to go through this first.
 */
async function openDecodedTab() {
    await userEvent.click(screen.getByRole('tab', { name: 'Decoded' }));
}

describe('DataPayloadSection', () => {
    beforeEach(() => {
        vi.mocked(trackEvent).mockClear();
        mockFetchAccountInfo.mockClear();
        // Nothing in the cache, which is the state every test starts from - a test that needs a resolved read
        // sets its own return value.
        mockUseAccountInfo.mockReset().mockReturnValue(undefined);
    });

    it('should render an inline Direct JSON payload as a pretty-printed document', async () => {
        renderSection({
            config: JSON_CONFIG,
            dataSource: DataSource.Direct,
            kind: 'setData',
            payload: pack(DOC, Compression.None),
        });
        await openDecodedTab();

        const decoded = screen.getByTestId('pmp-decoded-text');
        expect(decoded).toHaveTextContent('company');
        expect(decoded).toHaveTextContent('1.0.0');
        // Pretty-printed rather than echoed back verbatim, which is what separates a parsed document from the
        // verbatim-text fallback a Json payload lands on when its bytes do not parse.
        expect(decoded.textContent).toContain('\n  "name": "company"');
    });

    it('should also offer the raw encoded bytes on a Raw tab', async () => {
        renderSection({
            config: JSON_CONFIG,
            dataSource: DataSource.Direct,
            kind: 'setData',
            payload: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
        });

        await userEvent.click(screen.getByRole('tab', { name: 'Raw' }));

        // RawDataField owns the hex grid and the byte count, so asserting on them proves it is wired up.
        const raw = screen.getByTestId('pmp-payload-raw');
        expect(raw).toHaveTextContent('de ad be ef');
        expect(raw).toHaveTextContent('4 bytes');
        expect(screen.getByRole('tab', { name: 'Hex' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Base64' })).toBeInTheDocument();
    });

    it('should decompress a Zlib payload before rendering it', async () => {
        renderSection({
            config: { compression: Compression.Zlib, encoding: Encoding.Utf8, format: Format.Json },
            dataSource: DataSource.Direct,
            kind: 'setData',
            payload: pack(DOC, Compression.Zlib),
        });
        await openDecodedTab();

        expect(screen.getByTestId('pmp-decoded-text')).toHaveTextContent('1.0.0');
    });

    it('should render a Yaml payload as verbatim text rather than as a parsed document', async () => {
        renderSection({
            config: { compression: Compression.None, encoding: Encoding.Utf8, format: Format.Yaml },
            dataSource: DataSource.Direct,
            kind: 'setData',
            payload: pack('name: company\n', Compression.None),
        });
        await openDecodedTab();

        expect(screen.getByTestId('pmp-decoded-text')).toHaveTextContent('name: company');
    });

    it('should render an Encoding None payload as hex text rather than as characters', async () => {
        renderSection({
            config: { compression: Compression.None, encoding: Encoding.None, format: Format.None },
            dataSource: DataSource.Direct,
            kind: 'setData',
            payload: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
        });
        await openDecodedTab();

        expect(screen.getByTestId('pmp-decoded-text')).toHaveTextContent('deadbeef');
    });

    it('should render a Json-hinted payload that does not parse as verbatim text', async () => {
        renderSection({
            config: JSON_CONFIG,
            dataSource: DataSource.Direct,
            kind: 'setData',
            payload: pack('{not json', Compression.None),
        });
        await openDecodedTab();

        expect(screen.getByTestId('pmp-decoded-text')).toHaveTextContent('{not json');
    });

    it('should state that a header-only setData carries no new payload without surfacing a decode failure', () => {
        renderSection({ config: JSON_CONFIG, kind: 'setData' });

        expect(screen.getByTestId('pmp-header-only-note')).toBeInTheDocument();
        expect(screen.queryByTestId('pmp-decode-error')).not.toBeInTheDocument();
        expect(screen.queryByTestId('pmp-decoded-text')).not.toBeInTheDocument();
    });

    it('should show the source buffer address when setData carries no inline payload', () => {
        renderSection({
            config: JSON_CONFIG,
            dataSource: DataSource.Direct,
            kind: 'setData',
            sourceBuffer: BUFFER_ADDRESS,
        });

        expect(screen.getByText('The payload was written to the Source buffer account')).toBeInTheDocument();
        expect(screen.getByTestId('address')).toHaveTextContent(BUFFER_ADDRESS);
    });

    it('should show the metadata account when initialize is the in-place shape', () => {
        renderSection({
            config: JSON_CONFIG,
            dataSource: DataSource.Direct,
            kind: 'initialize',
            metadataAccount: METADATA_ADDRESS,
            seed: 'idl',
        });

        expect(screen.getByText('The payload was written to the Metadata account')).toBeInTheDocument();
        expect(screen.getByTestId('address')).toHaveTextContent(METADATA_ADDRESS);
    });

    it('should render an External payload through the same tabs, opening on the raw bytes', () => {
        renderSection({
            config: JSON_CONFIG,
            dataSource: DataSource.External,
            kind: 'setData',
            payload: new Uint8Array(40),
        });

        // A non-Direct source gets no special-cased note in this section: the card's `Data Source` config row
        // already names it, so the section stays a plain bytes view rather than repeating the same fact.
        expect(screen.getByTestId('pmp-payload-raw')).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Decoded' })).toBeInTheDocument();
        expect(screen.queryByTestId('pmp-decoded-text')).not.toBeInTheDocument();
    });

    it('should render a Url payload pointer as decoded text without resolving it', async () => {
        renderSection({
            config: JSON_CONFIG,
            dataSource: DataSource.Url,
            kind: 'setData',
            payload: new TextEncoder().encode('https://example.com/idl.json'),
        });
        await openDecodedTab();

        // The decoded panel applies the instruction's own hints to the POINTER bytes - a local decode, not
        // resolution. For a Url payload that is the URL text itself, and nothing is fetched or linked.
        expect(screen.getByTestId('pmp-decoded-text')).toHaveTextContent('https://example.com/idl.json');
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('should fall back to the raw view with an inline error note when the payload fails to decode', async () => {
        renderSection({
            config: { compression: Compression.Zlib, encoding: Encoding.Utf8, format: Format.Json },
            dataSource: DataSource.Direct,
            kind: 'setData',
            payload: new Uint8Array([1, 2, 3, 4]),
        });
        await openDecodedTab();

        expect(screen.getByTestId('pmp-decode-error')).toHaveTextContent('incorrect header check');
        expect(screen.queryByTestId('pmp-decoded-text')).not.toBeInTheDocument();
        // The failed panel no longer repeats a raw view of its own - Raw is a sibling tab, so the bytes stay one
        // click away. Assert the escape hatch is still reachable rather than that it is mounted right now.
        expect(screen.getByRole('tab', { name: 'Raw' })).toBeInTheDocument();
    });

    it('should render a bounded view with the byte count and a download when the payload exceeds the cap', async () => {
        renderSection(
            {
                config: JSON_CONFIG,
                dataSource: DataSource.Direct,
                kind: 'setData',
                payload: new Uint8Array(2048).fill(0x41),
            },
            8,
        );
        await openDecodedTab();

        const oversized = screen.getByTestId('pmp-payload-oversized');
        expect(oversized).toHaveTextContent(/too large/i);
        // The DECOMPRESSED size, which is what the cap is measured on - the on-chain payload here is 2048 bytes
        // uncompressed, so the two happen to match, but the number reported is the decoded one.
        expect(oversized).toHaveTextContent('2048 bytes');
        expect(screen.queryByTestId('pmp-decoded-text')).not.toBeInTheDocument();
        // The panel carries its OWN copy/download over the decompressed bytes. The sibling Raw tab is not a
        // substitute: that one serves the on-chain payload, so for a compressed document it would hand back the
        // compressed bytes. Without this the Alert's "Copy or download it instead" would point at nothing.
        expect(oversized).toHaveTextContent(/use download\/copy/i);
        expect(screen.getByLabelText('Download')).toBeInTheDocument();
    });

    it('should promise no download when the payload expands past the unpack limit', async () => {
        // What separates this from `oversized`: the unpack was abandoned, so no decompressed bytes exist to copy or
        // download. The panel must not offer an affordance it cannot honour.
        renderSection({
            config: { compression: Compression.Gzip, encoding: Encoding.Utf8, format: Format.Json },
            dataSource: DataSource.Direct,
            kind: 'setData',
            payload: gzip(new Uint8Array(2 * 1024 * 1024)),
        });
        await openDecodedTab();

        expect(screen.getByTestId('pmp-payload-unpack-overflow')).toHaveTextContent(/limit for unpacking/i);
        expect(screen.queryByTestId('pmp-payload-oversized')).not.toBeInTheDocument();
        expect(screen.queryByTestId('pmp-decoded-text')).not.toBeInTheDocument();
        // Radix unmounts the inactive panel, so the Raw tab's own download is not in the DOM either - the only
        // Download control that could match here would be one this panel rendered, and it must not render one.
        expect(screen.queryByLabelText('Download')).not.toBeInTheDocument();
    });

    it('should emit a tab analytics event when the reader opens the decoded tab', async () => {
        renderSection({
            config: JSON_CONFIG,
            dataSource: DataSource.Direct,
            kind: 'setData',
            payload: pack(DOC, Compression.None),
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
        renderSection({
            config: JSON_CONFIG,
            dataSource: DataSource.Url,
            kind: 'setData',
            payload: new TextEncoder().encode('https://example.com/idl.json'),
        });

        await userEvent.click(screen.getByRole('tab', { name: 'Decoded' }));

        expect(trackEvent).toHaveBeenCalledWith(
            'pmp_data_tab_opened',
            expect.objectContaining({ data_source: 'url', tab: 'decoded' }),
        );
    });

    it('should emit no analytics event on mount, before any tab is clicked', () => {
        renderSection({
            config: JSON_CONFIG,
            dataSource: DataSource.Direct,
            kind: 'setData',
            payload: pack(DOC, Compression.None),
        });

        // The default panel must not count as an interaction, or every rendered card inflates the tab counts.
        expect(trackEvent).not.toHaveBeenCalled();
    });

    it('should emit no analytics event when there are no tabs to click', () => {
        renderSection({ config: JSON_CONFIG, kind: 'setData' });

        expect(trackEvent).not.toHaveBeenCalled();
    });

    it('should read the referenced account on render, as raw bytes', () => {
        renderSection(DEFERRED_SET_DATA);

        expect(mockFetchAccountInfo).toHaveBeenCalledTimes(1);
        const [pubkey, dataMode] = mockFetchAccountInfo.mock.calls[0];
        expect(pubkey.toBase58()).toBe(BUFFER_ADDRESS);
        // `raw` and not `parsed`: the provider only keeps raw bytes for accounts it could not parse natively, and
        // a PMP buffer has to arrive as bytes for the generated decoder to see its header at all.
        expect(dataMode).toBe('raw');
        expect(screen.getByTestId('pmp-account-loading')).toBeInTheDocument();
    });

    it('should decode the referenced buffer content once the read resolves', async () => {
        mockUseAccountInfo.mockReturnValue(fetchedEntry(bufferAccountData(pack(DOC, Compression.None))));
        renderSection(DEFERRED_SET_DATA);
        await openDecodedTab();

        expect(screen.getByTestId('pmp-decoded-text')).toHaveTextContent('"name": "company"');
        expect(screen.getByRole('tab', { name: 'Raw' })).toBeInTheDocument();
    });

    it('should say the payload is empty rather than render a blank document', async () => {
        // `allocate` with no `write` yet leaves a live 96-byte buffer: header, no body. Every encoding decodes zero
        // bytes to the empty string, so the Decoded panel used to hold an empty `pre` that looked like a document
        // the reader had to scroll for. Lamports are non-zero, so this is NOT the closed-account shape.
        mockUseAccountInfo.mockReturnValue(fetchedEntry(bufferAccountData(new Uint8Array(0))));
        renderSection(DEFERRED_SET_DATA);
        await openDecodedTab();

        expect(screen.getByTestId('pmp-payload-empty')).toHaveTextContent(/payload is empty/i);
        expect(screen.queryByTestId('pmp-decoded-text')).not.toBeInTheDocument();
        expect(screen.queryByTestId('pmp-account-absent')).not.toBeInTheDocument();
        expect(screen.queryByTestId('pmp-decode-error')).not.toBeInTheDocument();
    });

    it('should say the account is gone rather than fail when the buffer was closed', () => {
        // The provider's closed-account shape, and the common outcome on a historical setData: the client closes
        // the source buffer in the same flow to reclaim its rent.
        mockUseAccountInfo.mockReturnValue(fetchedEntry(new Uint8Array(0), { lamports: 0 }));
        renderSection(DEFERRED_SET_DATA);

        expect(screen.getByTestId('pmp-account-absent')).toHaveTextContent(/does not exist on chain/i);
        expect(screen.queryByTestId('pmp-account-unreadable')).not.toBeInTheDocument();
    });

    it('should warn when the referenced account is not owned by the Program Metadata Program', () => {
        mockUseAccountInfo.mockReturnValue(
            fetchedEntry(bufferAccountData(pack(DOC, Compression.None)), { owner: BUFFER_ADDRESS }),
        );
        renderSection(DEFERRED_SET_DATA);

        expect(screen.getByTestId('pmp-account-unreadable')).toHaveTextContent(BUFFER_ADDRESS);
        expect(screen.queryByTestId('pmp-decoded-text')).not.toBeInTheDocument();
    });

    it('should request the bytes when the cached entry was fetched without them', () => {
        // The inspector fetches every account in the message in `skip` mode (`AddressWithContext`), which caches
        // the account with no bytes under the same key this hook reads. Decoding that entry reported a live
        // buffer as "shorter than the 96-byte header", intermittently, depending on which fetch settled last.
        mockUseAccountInfo.mockReturnValue(fetchedEntry(undefined, { lamports: 2_000_000 }));
        renderSection(DEFERRED_SET_DATA);

        expect(mockFetchAccountInfo).toHaveBeenCalledTimes(1);
        expect(mockFetchAccountInfo.mock.calls[0][1]).toBe('raw');
        expect(screen.getByTestId('pmp-account-loading')).toBeInTheDocument();
        expect(screen.queryByTestId('pmp-account-unreadable')).not.toBeInTheDocument();
    });

    it('should surface an RPC failure as its own state', () => {
        mockUseAccountInfo.mockReturnValue({ status: FetchStatus.FetchFailed });
        renderSection(DEFERRED_SET_DATA);

        expect(screen.getByTestId('pmp-account-failed')).toBeInTheDocument();
    });

    it('should mark a tab switch on account content as its own source', async () => {
        mockUseAccountInfo.mockReturnValue(fetchedEntry(bufferAccountData(pack(DOC, Compression.None))));
        renderSection(DEFERRED_SET_DATA);

        await openDecodedTab();

        // Without `source` the account panel's switches would be indistinguishable from the inline panel's.
        expect(trackEvent).toHaveBeenCalledWith(
            'pmp_data_tab_opened',
            expect.objectContaining({ source: 'account', tab: 'decoded' }),
        );
    });
});

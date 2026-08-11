import { gen } from '@__fixtures__/gen';
import { PMP_ADDRESS, PMP_EMPTY_DISCRIMINATOR, type PmpDecodedPayload } from '@entities/pmp-account';
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
} from '@solana-program/program-metadata';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { trackEvent } from '@/app/shared/lib/analytics';

import { PmpAccountCard } from '../PmpAccountCard';

const { mockDecodePmpPayload } = vi.hoisted(() => ({ mockDecodePmpPayload: vi.fn() }));

// Partial mock: the header read and the label maps stay real, because the point of the spec is which rows the
// header alone produces. Only the payload decode is observed - and observing it is also what proves the card
// decodes the payload from the header's own struct rather than re-reading the account.
vi.mock('@entities/pmp-account', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/pmp-account')>()),
    decodePmpPayload: mockDecodePmpPayload,
}));

// Partial, so the rest of the analytics barrel keeps working while `trackEvent` is observed.
vi.mock('@/app/shared/lib/analytics', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/shared/lib/analytics')>()),
    trackEvent: vi.fn(),
}));

vi.mock('@components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: { toBase58(): string } }) => <div data-testid="address">{pubkey.toBase58()}</div>,
}));

const TARGET_PROGRAM = gen.address(1) as Address;
const AUTHORITY = gen.address(2) as Address;

const DOC = '{"name":"company","version":"1.0.0"}';
const DOC_PRETTY = '{\n  "name": "company",\n  "version": "1.0.0"\n}';
const OTHER_DOC = '{"name":"other","version":"2.0.0"}';

function pack(content: string, compression: Compression): Uint8Array {
    return packDirectData({ compression, content, encoding: Encoding.Utf8 }).data as Uint8Array;
}

function metadataAccountData(body: Uint8Array): Uint8Array {
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
        seed: 'idl',
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
        owner: new PublicKey(PMP_ADDRESS),
        pubkey: gen.publicKey(3),
        space: raw.length,
    };
}

const DECODED: PmpDecodedPayload = { bytes: new TextEncoder().encode(DOC), kind: 'decoded', text: DOC_PRETTY };

const METADATA_ACCOUNT = metadataAccountData(pack(DOC, Compression.Zlib));

describe('PmpAccountCard', () => {
    beforeEach(() => {
        mockDecodePmpPayload.mockReset().mockReturnValue(DECODED);
        vi.mocked(trackEvent).mockClear();
    });

    it('should render the Metadata header identity from the header alone', () => {
        render(<PmpAccountCard account={toAccount(METADATA_ACCOUNT)} />);

        // These come from `readPmpAccountHeader`, which runs in a render memo and touches no payload bytes, so they
        // are present regardless of what the decode does. The loader frame they used to share is not asserted here:
        // the decode now runs synchronously inside the effect, which `render` flushes before this line.
        expect(screen.getByTestId('pmp-account-mutable')).toHaveTextContent('Yes');
        expect(screen.getByTestId('pmp-account-canonical')).toHaveTextContent('Yes');
        expect(screen.getByTestId('pmp-account-seed')).toHaveTextContent('idl');
    });

    it('should render the decoded document and the config it was decoded with', async () => {
        render(<PmpAccountCard account={toAccount(METADATA_ACCOUNT)} />);

        expect(await screen.findByTestId('pmp-account-document')).toHaveTextContent('"name": "company"');
        expect(mockDecodePmpPayload).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('pmp-account-encoding')).toHaveTextContent('UTF-8');
        expect(screen.getByTestId('pmp-account-compression')).toHaveTextContent('Zlib');
        expect(screen.getByTestId('pmp-account-format')).toHaveTextContent('JSON');
        // Derived from the field name, so it is camelCase rather than kebab: `pmp-account-${field}`.
        expect(screen.getByTestId('pmp-account-dataSource')).toHaveTextContent('Direct');
        expect(screen.getByTestId('pmp-account-dataLength')).toHaveTextContent('byte(s)');
        expect(screen.queryByTestId('pmp-account-decoded-pending')).not.toBeInTheDocument();
    });

    it('should decode again when the account bytes are replaced', async () => {
        const { rerender } = render(<PmpAccountCard account={toAccount(METADATA_ACCOUNT)} />);
        await screen.findByTestId('pmp-account-document');
        expect(mockDecodePmpPayload).toHaveBeenCalledTimes(1);

        // What a refresh from the card above this tab looks like from here: same address, different bytes.
        rerender(<PmpAccountCard account={toAccount(metadataAccountData(pack(OTHER_DOC, Compression.Zlib)))} />);

        await waitFor(() => expect(mockDecodePmpPayload).toHaveBeenCalledTimes(2));
    });

    // The card renders a plain `Card`, not `AccountCard`, so it offers neither control. Both are owned by the
    // account card one level up, which shows the same account's bytes - a second copy here would duplicate them.
    it('should offer neither a Raw nor a Refresh button, because the card above this tab owns both', () => {
        render(<PmpAccountCard account={toAccount(METADATA_ACCOUNT)} />);

        expect(screen.queryByRole('button', { name: 'Raw' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Refresh' })).not.toBeInTheDocument();
    });

    it('should render the decoder reason when the payload does not decode', async () => {
        mockDecodePmpPayload.mockReturnValue({
            kind: 'failed',
            reason: 'incorrect header check',
        } satisfies PmpDecodedPayload);
        render(<PmpAccountCard account={toAccount(METADATA_ACCOUNT)} />);

        expect(await screen.findByTestId('pmp-account-decode-error')).toHaveTextContent('incorrect header check');
        // A failed decode degrades to the header rows, it does not take out the tab.
        expect(screen.getByTestId('pmp-account-mutable')).toBeInTheDocument();
    });

    it('should render a Buffer account without decoding it, and say why', () => {
        render(<PmpAccountCard account={toAccount(bufferAccountData(pack(DOC, Compression.Zlib)))} />);

        expect(screen.getByTestId('pmp-account-buffer-note')).toBeInTheDocument();
        expect(screen.queryByTestId('pmp-account-encoding')).not.toBeInTheDocument();
        expect(screen.queryByTestId('pmp-account-decoded-pending')).not.toBeInTheDocument();
        expect(mockDecodePmpPayload).not.toHaveBeenCalled();
    });

    it('should render an Empty account as allocated but not written yet', () => {
        const raw = bufferAccountData(new Uint8Array(0));
        raw[0] = PMP_EMPTY_DISCRIMINATOR;
        render(<PmpAccountCard account={toAccount(raw)} />);

        expect(screen.getByTestId('pmp-account-empty-note')).toBeInTheDocument();
        expect(mockDecodePmpPayload).not.toHaveBeenCalled();
    });

    it('should render an account shorter than the header as unreadable rather than blank', () => {
        render(<PmpAccountCard account={toAccount(new Uint8Array(95))} />);

        expect(screen.getByTestId('pmp-account-unreadable-note')).toHaveTextContent('96-byte');
        expect(mockDecodePmpPayload).not.toHaveBeenCalled();
    });

    // This tab reports no analytics of its own: a route-level open is already a GA4 page view, and the card has no
    // reader interaction left to instrument now that Raw and Refresh live on the card above it.
    it('should report no analytics event', () => {
        render(<PmpAccountCard account={toAccount(METADATA_ACCOUNT)} />);

        expect(trackEvent).not.toHaveBeenCalled();
    });
});

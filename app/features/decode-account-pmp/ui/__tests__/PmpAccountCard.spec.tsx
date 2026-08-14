import { gen } from '@__fixtures__/gen';
import { PMP_ADDRESS, PMP_EMPTY_DISCRIMINATOR, type PmpPayloadDecodeResult } from '@entities/pmp-account';
import type { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { Compression } from '@solana-program/program-metadata';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { trackEvent } from '@/app/shared/lib/analytics';

import { bufferAccountData, metadataAccountData, pack } from '../__fixtures__/pmp-account-fixtures';
import { PmpAccountCard } from '../PmpAccountCard';

const { mockDecodePmpPayload, mockFindConfigInTransactions } = vi.hoisted(() => ({
    mockDecodePmpPayload: vi.fn(),
    mockFindConfigInTransactions: vi.fn(),
}));

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

vi.mock('@providers/cluster', () => ({ useCluster: () => ({ url: 'https://api.devnet.solana.com' }) }));

vi.mock('../../api/find-config-in-transactions', async importOriginal => ({
    ...(await importOriginal<typeof import('../../api/find-config-in-transactions')>()),
    findConfigInTransactions: mockFindConfigInTransactions,
}));

const DOC = '{"name":"company","version":"1.0.0"}';
const DOC_PRETTY = '{\n  "name": "company",\n  "version": "1.0.0"\n}';
const OTHER_DOC = '{"name":"other","version":"2.0.0"}';

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

const DECODED: PmpPayloadDecodeResult = { bytes: new TextEncoder().encode(DOC), kind: 'decoded', text: DOC_PRETTY };

const METADATA_ACCOUNT = metadataAccountData(pack(DOC, Compression.Zlib));

describe('PmpAccountCard', () => {
    beforeEach(() => {
        mockDecodePmpPayload.mockReset().mockReturnValue(DECODED);
        mockFindConfigInTransactions.mockReset().mockResolvedValue({ kind: 'not-found' });
        vi.mocked(trackEvent).mockClear();
    });

    it('should render the Metadata header identity from the header alone', () => {
        render(<PmpAccountCard account={toAccount(METADATA_ACCOUNT)} />);

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

    it('should render a binary Metadata payload as raw bytes rather than as a document', async () => {
        const binary = Uint8Array.from({ length: 64 }, (_, index) => 128 + ((index * 37) % 128));
        mockDecodePmpPayload.mockReturnValue({ bytes: binary, kind: 'decoded', text: 'gKXK75S53oOozfKX' });

        render(<PmpAccountCard account={toAccount(METADATA_ACCOUNT)} />);

        expect(await screen.findByTestId('pmp-account-raw')).toBeInTheDocument();
        expect(screen.queryByTestId('pmp-account-document')).not.toBeInTheDocument();
        // The declared config still renders: what changed is how the payload is presented, not what it claims.
        expect(screen.getByTestId('pmp-account-encoding')).toHaveTextContent('UTF-8');
    });

    it('should keep rendering a readable Metadata payload as a document', async () => {
        render(<PmpAccountCard account={toAccount(METADATA_ACCOUNT)} />);

        expect(await screen.findByTestId('pmp-account-document')).toBeInTheDocument();
        expect(screen.queryByTestId('pmp-account-raw')).not.toBeInTheDocument();
    });

    it('should decode again when the account bytes are replaced', async () => {
        const { rerender } = render(<PmpAccountCard account={toAccount(METADATA_ACCOUNT)} />);
        await screen.findByTestId('pmp-account-document');
        expect(mockDecodePmpPayload).toHaveBeenCalledTimes(1);

        // What a refresh from the card above this tab looks like from here: same address, different bytes.
        rerender(<PmpAccountCard account={toAccount(metadataAccountData(pack(OTHER_DOC, Compression.Zlib)))} />);

        await waitFor(() => expect(mockDecodePmpPayload).toHaveBeenCalledTimes(2));
    });

    it('should render the decoder reason when the payload does not decode', async () => {
        mockDecodePmpPayload.mockReturnValue({
            kind: 'failed',
            reason: 'incorrect header check',
        } satisfies PmpPayloadDecodeResult);
        render(<PmpAccountCard account={toAccount(METADATA_ACCOUNT)} />);

        expect(await screen.findByTestId('pmp-account-payload-undecodable')).toHaveTextContent(
            'incorrect header check',
        );
        // A failed decode degrades to the header rows, it does not take out the tab.
        expect(screen.getByTestId('pmp-account-mutable')).toBeInTheDocument();
    });

    it('should decode a Buffer account from its bytes and say the config was resolved from them', async () => {
        render(<PmpAccountCard account={toAccount(bufferAccountData(pack(DOC, Compression.Zlib)))} />);

        expect(await screen.findByTestId('pmp-account-buffer-note')).toHaveTextContent('resolved from bytes');
        expect(screen.getByTestId('pmp-account-compression')).toHaveTextContent('Zlib');
        expect(screen.getByTestId('pmp-account-format')).toHaveTextContent('JSON');
        expect(screen.getByTestId('pmp-account-document')).toHaveTextContent('company');

        expect(screen.queryByTestId('pmp-account-encoding')).not.toBeInTheDocument();
        expect(screen.queryByTestId('pmp-account-dataSource')).not.toBeInTheDocument();

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
});

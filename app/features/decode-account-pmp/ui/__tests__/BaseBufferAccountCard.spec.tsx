import { gen } from '@__fixtures__/gen';
import { Compression, DataSource, Encoding, Format } from '@solana-program/program-metadata';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { resolveBufferConfigFromBytes } from '../../lib/config-resolution/resolve-buffer-config-from-bytes';
import {
    AUTHORITY,
    bufferAccountData,
    type BufferHeaderOverrides,
    pack,
    readAs,
    YAML_DOC,
} from '../__fixtures__/pmp-account-fixtures';
import { BaseBufferAccountCard } from '../BaseBufferAccountCard';

// Both render address-shaped links that reach for the active cluster, which has no provider here. The rows under
// test are the config enums, so stubbing them keeps this spec to the precedence question.
vi.mock('@components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: { toBase58(): string } }) => <div data-testid="address">{pubkey.toBase58()}</div>,
}));

vi.mock('@components/common/Signature', () => ({
    Signature: ({ signature }: { signature: string }) => <span data-testid="signature">{signature}</span>,
}));

/**
 * Derives both data props from the body the same way the card's stateful half does, so a hand-written from-bytes
 * result cannot drift from what `resolveBufferConfigFromBytes` actually returns for these bytes.
 */
function bufferArgs(body: Uint8Array, header: BufferHeaderOverrides = {}) {
    return {
        buffer: readAs(bufferAccountData(body, header), 'buffer'),
        configFromBytes: { result: resolveBufferConfigFromBytes(body), status: 'ready' as const },
        configFromOnchain: { status: 'skipped' as const },
    };
}

describe('BaseBufferAccountCard', () => {
    it('should show the compression resolved from bytes even when the onchain config states a different one', () => {
        render(
            <BaseBufferAccountCard
                {...bufferArgs(pack(YAML_DOC, Compression.Gzip))}
                configFromOnchain={{
                    result: {
                        config: { compression: Compression.None, encoding: Encoding.Base64, format: Format.Yaml },
                        dataSource: DataSource.Direct,
                        kind: 'found-for-buffer-acc',
                        signature: gen.address(4),
                    },
                    status: 'ready',
                }}
            />,
        );

        expect(screen.getByTestId('pmp-account-compression')).toHaveTextContent('Gzip');
    });

    it('should take encoding, format and data source from the onchain config', () => {
        render(
            <BaseBufferAccountCard
                {...bufferArgs(pack(YAML_DOC, Compression.Gzip))}
                configFromOnchain={{
                    result: {
                        config: { compression: Compression.None, encoding: Encoding.Base64, format: Format.Yaml },
                        dataSource: DataSource.Direct,
                        kind: 'found-for-buffer-acc',
                        signature: gen.address(4),
                    },
                    status: 'ready',
                }}
            />,
        );

        expect(screen.getByTestId('pmp-account-encoding')).toHaveTextContent('Base64');
        expect(screen.getByTestId('pmp-account-format')).toHaveTextContent('YAML');
        expect(screen.getByTestId('pmp-account-dataSource')).toHaveTextContent('Direct');
    });

    it('should show the compression resolved from bytes when nothing was resolved onchain', () => {
        render(<BaseBufferAccountCard {...bufferArgs(pack(YAML_DOC, Compression.Gzip))} />);

        expect(screen.getByTestId('pmp-account-compression')).toHaveTextContent('Gzip');
        expect(screen.queryByTestId('pmp-account-encoding')).not.toBeInTheDocument();
    });

    // A dead scan and a scan that found nothing leave the same rows blank, so the note is the only thing that can tell
    // them apart. Without this, a broken RPC is indistinguishable from a buffer no transaction ever declared.
    it('should say the transactions could not be checked when the onchain scan failed', () => {
        render(
            <BaseBufferAccountCard
                {...bufferArgs(pack(YAML_DOC, Compression.Gzip))}
                configFromOnchain={{ result: { kind: 'failed', reason: 'fetch failed' }, status: 'ready' }}
            />,
        );

        expect(screen.getByTestId('pmp-account-buffer-lookup-failed-note')).toHaveTextContent('could not be checked');
        expect(screen.queryByTestId('pmp-account-buffer-note')).not.toBeInTheDocument();

        // The failure costs the two onchain-only rows and nothing else: the document still renders off the bytes.
        expect(screen.getByTestId('pmp-account-compression')).toHaveTextContent('Gzip');
        expect(screen.getByTestId('pmp-account-document')).toHaveTextContent('name: orbit');
        expect(screen.queryByTestId('pmp-account-encoding')).not.toBeInTheDocument();
    });

    it('should render a keypair buffer with no program while hiding canonical and seed', () => {
        render(
            <BaseBufferAccountCard
                {...bufferArgs(pack(YAML_DOC, Compression.Gzip), { canonical: false, program: null, seed: '' })}
            />,
        );

        expect(screen.getByTestId('pmp-account-program')).toHaveTextContent('None');
        expect(screen.getByTestId('pmp-account-authority')).toHaveTextContent(AUTHORITY);
        expect(screen.queryByTestId('pmp-account-canonical')).not.toBeInTheDocument();
        expect(screen.queryByTestId('pmp-account-seed')).not.toBeInTheDocument();
    });

    it('should render canonical and seed on a PDA buffer', () => {
        render(<BaseBufferAccountCard {...bufferArgs(pack(YAML_DOC, Compression.Gzip))} />);

        expect(screen.getByTestId('pmp-account-canonical')).toHaveTextContent('Yes');
        expect(screen.getByTestId('pmp-account-seed')).toHaveTextContent('security');
    });

    it('should render an unwritten buffer as allocated but not written yet', () => {
        render(<BaseBufferAccountCard {...bufferArgs(new Uint8Array(0))} />);

        expect(screen.getByTestId('pmp-account-buffer-empty-note')).toHaveTextContent('has not been written yet');
    });

    it('should say the stream is incomplete while write chunks are still landing', () => {
        render(
            <BaseBufferAccountCard
                {...bufferArgs(pack(YAML_DOC, Compression.Gzip))}
                configFromBytes={{ result: { kind: 'incomplete' }, status: 'ready' }}
            />,
        );

        expect(screen.getByTestId('pmp-account-buffer-incomplete-note')).toHaveTextContent('incomplete');
    });

    it('should report a failed read of the buffer itself', () => {
        render(
            <BaseBufferAccountCard
                {...bufferArgs(pack(YAML_DOC, Compression.Gzip))}
                configFromBytes={{ status: 'failed' }}
            />,
        );

        expect(screen.getByTestId('pmp-account-buffer-read-failed-note')).toHaveTextContent(
            'Could not read this buffer',
        );
    });

    it('should surface the inflate reason when a declared container fails to unpack', () => {
        render(
            <BaseBufferAccountCard
                {...bufferArgs(pack(YAML_DOC, Compression.Gzip))}
                configFromBytes={{
                    result: { kind: 'unpack-error', reason: 'invalid distance too far back' },
                    status: 'ready',
                }}
            />,
        );

        expect(screen.getByTestId('pmp-account-buffer-unpack-error-note')).toHaveTextContent(
            'invalid distance too far back',
        );
    });

    it('should say the payload expands past the unpack limit', () => {
        render(
            <BaseBufferAccountCard
                {...bufferArgs(pack(YAML_DOC, Compression.Gzip))}
                configFromBytes={{ result: { kind: 'overflow', limit: 1024 }, status: 'ready' }}
            />,
        );

        expect(screen.getByTestId('pmp-account-payload-unpack-overflow')).toHaveTextContent('1024-byte limit');
    });

    it('should offer the decompressed bytes when the payload is too large to render', () => {
        render(
            <BaseBufferAccountCard
                {...bufferArgs(pack(YAML_DOC, Compression.Gzip))}
                configFromBytes={{
                    result: { budget: 2, bytes: new Uint8Array([1, 2, 3]), kind: 'oversized' },
                    status: 'ready',
                }}
            />,
        );

        expect(screen.getByTestId('pmp-account-payload-too-large')).toHaveTextContent('3 bytes, limit 2');
        expect(screen.getByTestId('pmp-account-raw')).toBeInTheDocument();
    });
});

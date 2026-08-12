import { gen } from '@__fixtures__/gen';
import { readPmpAccount } from '@entities/pmp-account';
import type { Address } from '@solana/kit';
import {
    Compression,
    DataSource,
    Encoding,
    Format,
    getBufferEncoder,
    packDirectData,
    PROGRAM_METADATA_PROGRAM_ADDRESS,
} from '@solana-program/program-metadata';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { resolveBufferConfigFromBytes } from '../../lib/config-resolution/resolve-buffer-config-from-bytes';
import { BaseBufferAccountCard, type BufferAccountRead } from '../BaseBufferAccountCard';

// Both render address-shaped links that reach for the active cluster, which has no provider here. The rows under
// test are the config enums, so stubbing them keeps this spec to the precedence question.
vi.mock('@components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: { toBase58(): string } }) => <div data-testid="address">{pubkey.toBase58()}</div>,
}));

vi.mock('@components/common/Signature', () => ({
    Signature: ({ signature }: { signature: string }) => <span data-testid="signature">{signature}</span>,
}));

const TARGET_PROGRAM = gen.address(1) as Address;
const AUTHORITY = gen.address(2) as Address;

const YAML_DOC = 'name: orbit\nversion: 1.0.0\n';

/** The library's own producer, so the body is a byte-exact round trip of what the client puts on chain. */
function pack(content: string, compression: Compression): Uint8Array {
    return packDirectData({ compression, content, encoding: Encoding.Utf8 }).data as Uint8Array;
}

/**
 * Derives both data props from the body the same way the card's stateful half does, so a hand-written from-bytes
 * result cannot drift from what `resolveBufferConfigFromBytes` actually returns for these bytes.
 */
function bufferArgs(body: Uint8Array) {
    const raw = getBufferEncoder().encode({
        authority: AUTHORITY,
        canonical: true,
        data: body,
        program: TARGET_PROGRAM,
        seed: 'security',
    }) as Uint8Array;

    return {
        buffer: readPmpAccount({
            account: { data: raw, lamports: 2_000_000, owner: PROGRAM_METADATA_PROGRAM_ADDRESS },
        }) as BufferAccountRead,
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
});

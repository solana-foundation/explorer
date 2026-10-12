import { gen } from '@__fixtures__/gen';
import { TxInstructionSurface } from '@entities/instruction-card';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    Compression,
    DataSource,
    Encoding,
    Format,
    getAllocateInstructionDataEncoder,
    getInitializeInstructionDataEncoder,
    getSetDataInstructionDataEncoder,
    getWriteInstructionDataEncoder,
    packDirectData,
} from '@solana-program/program-metadata';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PMP_ADDRESS } from '../../lib/constants';
import { decodePmpContentInstruction } from '../../lib/decode-pmp-instruction';
import { PmpDetailsCard } from '../PmpDetailsCard';

vi.mock('@/app/shared/lib/analytics', () => ({ trackEvent: vi.fn() }));

vi.mock('../../lib/decode-pmp-instruction', async importOriginal => {
    const actual = await importOriginal<typeof import('../../lib/decode-pmp-instruction')>();
    return { decodePmpContentInstruction: vi.fn(actual.decodePmpContentInstruction) };
});

vi.mock('@/app/components/instruction/InstructionCard', () => ({
    InstructionCard: ({ children, title }: { children: React.ReactNode; title: string }) => (
        <div data-testid="instruction-card">
            <div data-testid="instruction-card-title">{title}</div>
            <table>
                <tbody>{children}</tbody>
            </table>
        </div>
    ),
}));

vi.mock('@/app/components/common/Address', () => ({
    Address: ({ pubkey, overrideText }: { pubkey: PublicKey; overrideText?: string }) => (
        <div data-testid="address">{overrideText ?? pubkey.toBase58()}</div>
    ),
}));

vi.mock('@/app/components/common/Copyable', () => ({
    Copyable: ({ children }: { children: React.ReactNode }) => <div data-testid="copyable">{children}</div>,
}));

const PMP = new PublicKey(PMP_ADDRESS);
const AUTHORITY = gen.publicKey(0);
const FOREIGN_BUFFER = gen.publicKey(1);
const METADATA_PDA = gen.publicKey(2);
const DOC = '{"name":"company","version":"1.0.0"}';

function makeIx(data: Uint8Array, accounts: PublicKey[]): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(data),
        keys: accounts.map(pubkey => ({ isSigner: false, isWritable: true, pubkey })),
        programId: PMP,
    });
}

function renderCard(ix: TransactionInstruction) {
    return render(
        <TxInstructionSurface result={{ err: null }}>
            <PmpDetailsCard ix={ix} index={0} fallback={<div data-testid="injected-fallback" />} />
        </TxInstructionSurface>,
    );
}

/** The payload section opens on the Raw tab and Radix unmounts the inactive panel. See DataPayloadSection.spec. */
async function openDecodedTab() {
    await userEvent.click(screen.getByRole('tab', { name: 'Decoded' }));
}

describe('PmpDetailsCard', () => {
    afterEach(() => {
        vi.mocked(decodePmpContentInstruction).mockReset();
        vi.restoreAllMocks();
    });

    it('should render a SetData card with named accounts, hint arguments and the decoded document', async () => {
        const packed = packDirectData({ compression: Compression.Zlib, content: DOC, encoding: Encoding.Utf8 });
        const ix = makeIx(
            getSetDataInstructionDataEncoder().encode({
                compression: packed.compression,
                data: packed.data,
                dataSource: DataSource.Direct,
                encoding: packed.encoding,
                format: Format.Json,
            }) as Uint8Array,
            [METADATA_PDA, AUTHORITY, PMP, PMP, PMP],
        );

        renderCard(ix);
        await openDecodedTab();

        expect(screen.getByTestId('instruction-card-title')).toHaveTextContent('ProgramMetadata: SetData');
        expect(screen.getByTestId('account-row-0')).toHaveTextContent('Metadata');
        expect(screen.getByTestId('account-row-1')).toHaveTextContent('Authority');
        expect(screen.getByTestId('account-row-4')).toHaveTextContent('ProgramData');
        expect(readArgs()).toEqual([
            ['encoding', 'enum', 'UTF-8'],
            ['compression', 'enum', 'Zlib'],
            ['format', 'enum', 'JSON'],
            ['dataSource', 'enum', 'Direct'],
        ]);
        expect(screen.getByTestId('pmp-decoded-text')).toHaveTextContent('company');
        expect(screen.getByTestId('pmp-payload-data-hash')).toBeInTheDocument();
    });

    it('should name the program in the Program row', () => {
        renderCard(makeIx(new Uint8Array([3, 1, 0, 1]), [METADATA_PDA, AUTHORITY, PMP]));

        expect(screen.getByText('ProgramMetadata')).toBeInTheDocument();
    });

    it('should label an account past the named ones as a remaining account', () => {
        renderCard(makeIx(new Uint8Array([3, 1, 0, 1]), [METADATA_PDA, AUTHORITY, PMP, PMP, PMP, AUTHORITY]));

        expect(screen.getByTestId('account-row-4')).toHaveTextContent('ProgramData');
        expect(screen.getByTestId('account-row-5')).toHaveTextContent('Remaining Account #1');
    });

    it('should render the updated hints and the header-only note for a 4-byte setData', () => {
        renderCard(makeIx(new Uint8Array([3, 1, 0, 1]), [METADATA_PDA, AUTHORITY, PMP]));

        expect(screen.getByTestId('instruction-card-title')).toHaveTextContent('ProgramMetadata: SetData');
        expect(readArgs()).toEqual([
            ['encoding', 'enum', 'UTF-8'],
            ['compression', 'enum', 'None'],
            ['format', 'enum', 'JSON'],
        ]);
        expect(screen.getByTestId('pmp-no-payload')).toBeInTheDocument();
    });

    it('should render an Initialize card with its seed and decoded document', async () => {
        const ix = makeIx(
            getInitializeInstructionDataEncoder().encode({
                compression: Compression.None,
                data: new TextEncoder().encode(DOC),
                dataSource: DataSource.Direct,
                encoding: Encoding.Utf8,
                format: Format.Json,
                seed: 'idl',
            }) as Uint8Array,
            [METADATA_PDA, AUTHORITY, PMP, PMP, PMP],
        );

        renderCard(ix);
        await openDecodedTab();

        expect(screen.getByTestId('instruction-card-title')).toHaveTextContent('ProgramMetadata: Initialize');
        expect(readArgs()).toEqual([
            ['seed', 'string', 'idl'],
            ['encoding', 'enum', 'UTF-8'],
            ['compression', 'enum', 'None'],
            ['format', 'enum', 'JSON'],
            ['dataSource', 'enum', 'Direct'],
        ]);
        expect(screen.getByTestId('account-row-4')).toHaveTextContent('System');
        expect(screen.getByTestId('pmp-decoded-text')).toHaveTextContent('1.0.0');
    });

    it('should show a Write card with its offset and raw chunk and no decoded document', () => {
        const ix = makeIx(
            getWriteInstructionDataEncoder().encode({
                data: new Uint8Array([0xde, 0xad]),
                offset: 96,
            }) as Uint8Array,
            [FOREIGN_BUFFER, AUTHORITY, PMP],
        );

        renderCard(ix);

        expect(screen.getByTestId('instruction-card-title')).toHaveTextContent('ProgramMetadata: Write');
        expect(screen.getByTestId('account-row-0')).toHaveTextContent('Buffer');
        expect(screen.getByTestId('account-row-2')).toHaveTextContent('SourceBuffer');
        expect(readArgs()).toEqual([['offset', 'number', '96']]);
        // RawDataField owns the hex grid and the byte count inside the Chunk row.
        expect(screen.getByTestId('pmp-write-chunk')).toHaveTextContent('de ad');
        expect(screen.getByTestId('pmp-write-chunk')).toHaveTextContent('2 bytes');
        expect(screen.queryByTestId('pmp-decoded-text')).not.toBeInTheDocument();
        expect(screen.queryByTestId('pmp-payload-section')).not.toBeInTheDocument();
    });

    it('should show the source buffer note for a Write that copies from another buffer', () => {
        const ix = makeIx(getWriteInstructionDataEncoder().encode({ offset: 0 }) as Uint8Array, [
            METADATA_PDA,
            AUTHORITY,
            FOREIGN_BUFFER,
        ]);

        renderCard(ix);

        expect(screen.getByTestId('pmp-write-source-buffer')).toHaveTextContent(
            'The chunk was copied from the SourceBuffer account',
        );
        const sourceBufferRow = screen.getByTestId('account-row-2');
        expect(sourceBufferRow).toHaveTextContent('SourceBuffer');
        expect(sourceBufferRow).toHaveTextContent(FOREIGN_BUFFER.toBase58());
        expect(screen.queryByTestId('pmp-write-chunk')).not.toBeInTheDocument();
    });

    it('should state that a Write with no chunk bytes and no source buffer carries no payload', () => {
        const ix = makeIx(getWriteInstructionDataEncoder().encode({ offset: 0 }) as Uint8Array, [
            METADATA_PDA,
            AUTHORITY,
            PMP,
        ]);

        renderCard(ix);

        expect(screen.getByTestId('pmp-write-absent-chunk')).toHaveTextContent(
            'This instruction carries no payload bytes.',
        );
        expect(screen.queryByTestId('pmp-write-chunk')).not.toBeInTheDocument();
        expect(screen.queryByTestId('pmp-write-source-buffer')).not.toBeInTheDocument();
    });

    it('should render the injected fallback for a housekeeping instruction', () => {
        const ix = makeIx(getAllocateInstructionDataEncoder().encode({ seed: 'idl' }) as Uint8Array, [
            METADATA_PDA,
            AUTHORITY,
        ]);

        renderCard(ix);

        expect(screen.getByTestId('injected-fallback')).toBeInTheDocument();
        expect(screen.queryByTestId('instruction-card')).not.toBeInTheDocument();
    });

    it('should render the injected fallback when the card throws', () => {
        const failure = new Error('decode failed');
        vi.mocked(decodePmpContentInstruction).mockImplementation(() => {
            throw failure;
        });
        vi.spyOn(console, 'error').mockImplementation(() => undefined);

        renderCard(makeIx(new Uint8Array([3, 1, 0, 1]), [METADATA_PDA, AUTHORITY]));

        expect(screen.getByTestId('injected-fallback')).toBeInTheDocument();
    });

    it('should keep the account and argument rows when the payload fails to decode', async () => {
        const ix = makeIx(
            getSetDataInstructionDataEncoder().encode({
                compression: Compression.Zlib, // a Zlib stream that is not one
                data: new Uint8Array([1, 2, 3, 4]),
                dataSource: DataSource.Direct,
                encoding: Encoding.Utf8,
                format: Format.Json,
            }) as Uint8Array,
            [METADATA_PDA, AUTHORITY, PMP, PMP, PMP],
        );

        renderCard(ix);
        await openDecodedTab();

        expect(screen.getByTestId('pmp-decode-error')).toBeInTheDocument();
        expect(screen.getByTestId('account-row-0')).toHaveTextContent('Metadata');
        expect(readArgs().slice(0, 2)).toEqual([
            ['encoding', 'enum', 'UTF-8'],
            ['compression', 'enum', 'Zlib'],
        ]);
        expect(screen.queryByTestId('injected-fallback')).not.toBeInTheDocument();
    });
});

function readArgs(): string[][] {
    return screen
        .queryAllByRole('row')
        .filter(row => row.dataset.testid?.startsWith('ix-args-0-'))
        .map(row => Array.from(row.querySelectorAll('td'), cell => cell.textContent ?? ''));
}

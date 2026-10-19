import { gen } from '@__fixtures__/gen';
import { customIdlStorage } from '@entities/idl/api/custom-idl-storage';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import codamaPmpIdl from '@entities/idl/mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { PMP_ADDRESS } from '@entities/pmp-account/lib/program-address';
import { getBase58Decoder } from '@solana/kit';
import {
    type CompiledInnerInstruction,
    type MessageV0,
    PublicKey,
    TransactionInstruction,
    TransactionMessage,
} from '@solana/web3.js';
import {
    Compression,
    DataSource,
    Encoding,
    Format,
    getSetDataInstructionDataEncoder,
} from '@solana-program/program-metadata';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { render, screen } from '@testing-library/react';
import { createStore, Provider as JotaiProvider } from 'jotai';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

import { InstructionParserProvider } from '@/app/entities/instruction-parser';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';

import { InstructionsSection } from '../InstructionsSection';

const mocks = vi.hoisted(() => ({ throwingProgram: 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo' }));

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

vi.mock('swr/immutable', () => ({ __esModule: true, default: vi.fn(() => ({ data: undefined, isLoading: false })) }));

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => '/'),
    useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock('@features/decode-instruction-with-idl', async importOriginal => {
    const original = await importOriginal<typeof import('@features/decode-instruction-with-idl')>();
    return {
        ...original,
        useIdlInstructionDecode: (args: Parameters<typeof original.useIdlInstructionDecode>[0]) => {
            if (args.programId === mocks.throwingProgram) throw new Error('render failed');
            return original.useIdlInstructionDecode(args);
        },
    };
});

const PAYER = gen.publicKey(0);
const DEVI = new PublicKey(anchorModernIdl.address);
const TOKEN_PROGRAM = new PublicKey(TOKEN_PROGRAM_ADDRESS);
const THROWING_PROGRAM = new PublicKey(mocks.throwingProgram);
const METAPLEX_PROGRAM = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

const CREATE_AMM_CONFIG_IX = new TransactionInstruction({
    data: Buffer.from([137, 52, 237, 212, 215, 117, 108, 104, ...new Array(16).fill(0)]),
    keys: [1, 2, 3].map(index => ({ isSigner: false, isWritable: true, pubkey: gen.publicKey(index) })),
    programId: DEVI,
});

const TOKEN_TRANSFER_IX = new TransactionInstruction({
    data: Buffer.from([3, 1, 0, 0, 0, 0, 0, 0, 0]),
    keys: [
        { isSigner: false, isWritable: true, pubkey: gen.publicKey(4) },
        { isSigner: false, isWritable: true, pubkey: gen.publicKey(5) },
        { isSigner: true, isWritable: false, pubkey: PAYER },
    ],
    programId: TOKEN_PROGRAM,
});

describe('Inspector InstructionsSection with a custom IDL', () => {
    test('should decode with the selected custom IDL and show the selector', async () => {
        await storeCustomIdl(DEVI, 'custom');
        renderSection(CREATE_AMM_CONFIG_IX);

        expect(await screen.findByText('Create Amm Config', { exact: false })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'IDL: Custom' })).toBeInTheDocument();
    });

    test('should decode a Program Metadata instruction with the selected custom IDL, not the PMP card', async () => {
        const address = new PublicKey(PMP_ADDRESS).toBase58();
        await customIdlStorage.put({
            programAddress: address,
            value: JSON.stringify({ idl: codamaPmpIdl, origin: { kind: 'pasted' }, selected: 'custom' }),
        });
        const data = getSetDataInstructionDataEncoder().encode({
            compression: Compression.None,
            data: new TextEncoder().encode('{"name":"company"}'),
            dataSource: DataSource.Direct,
            encoding: Encoding.Utf8,
            format: Format.Json,
        }) as Uint8Array;
        renderSection(
            new TransactionInstruction({
                data: Buffer.from(data),
                keys: [2, 3].map(index => ({ isSigner: false, isWritable: true, pubkey: gen.publicKey(index) })),
                programId: new PublicKey(PMP_ADDRESS),
            }),
        );

        expect(await screen.findByText('Utf8')).toBeInTheDocument();
        expect(screen.queryByText('Data Hash')).not.toBeInTheDocument();
    });

    test('should show the loading card, not the Explorer decode, before the store reads the custom selection', async () => {
        await storeCustomIdl(TOKEN_PROGRAM, 'custom');
        const rendered: string[] = [];
        const observer = new MutationObserver(() => rendered.push(document.body.textContent ?? ''));
        observer.observe(document.body, { characterData: true, childList: true, subtree: true });

        renderSection(TOKEN_TRANSFER_IX);

        expect(screen.getByText('Loading instruction')).toBeInTheDocument();
        await screen.findByText('The custom IDL could not decode this instruction.');
        observer.disconnect();
        expect(rendered.some(text => text.includes('Token Program: Transfer'))).toBe(false);
    });

    test('should show the selector on an Explorer decoder card when the on-chain IDL is selected', async () => {
        await storeCustomIdl(TOKEN_PROGRAM, 'onChain');
        renderSection(TOKEN_TRANSFER_IX);

        expect(await screen.findByText('Token Program: Transfer')).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: 'IDL: None' })).toBeInTheDocument();
    });

    test('should show the selector on a Metaplex card when the on-chain IDL is selected', async () => {
        await storeCustomIdl(METAPLEX_PROGRAM, 'onChain');
        renderSection(new TransactionInstruction({ data: Buffer.from([255]), keys: [], programId: METAPLEX_PROGRAM }));

        expect(await screen.findByText('Token Metadata Program: Unknown Instruction')).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: 'IDL: None' })).toBeInTheDocument();
    });

    test('should show the selector on a decoded Metaplex card when the on-chain IDL is selected', async () => {
        await storeCustomIdl(METAPLEX_PROGRAM, 'onChain');
        const keys = [1, 2].map(index => ({ isSigner: false, isWritable: true, pubkey: gen.publicKey(index) }));
        renderSection(new TransactionInstruction({ data: Buffer.from([7]), keys, programId: METAPLEX_PROGRAM }));

        expect(await screen.findByText('Sign Metadata', { exact: false })).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: 'IDL: None' })).toBeInTheDocument();
    });

    test('should not show the parent program selector on the fallback card of an inner instruction', async () => {
        await storeCustomIdl(DEVI, 'custom');
        renderSectionWithInner(CREATE_AMM_CONFIG_IX, THROWING_PROGRAM);

        expect(await screen.findByText('#1.1')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'IDL: Custom' })).toHaveLength(1);
    });

    test('should show the inner program selector on the fallback card of an inner instruction', async () => {
        await storeCustomIdl(DEVI, 'custom');
        await storeCustomIdl(THROWING_PROGRAM, 'onChain');
        renderSectionWithInner(CREATE_AMM_CONFIG_IX, THROWING_PROGRAM);

        expect(await screen.findByText('#1.1')).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: 'IDL: None' })).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'IDL: Custom' })).toHaveLength(1);
    });
});

function storeCustomIdl(programId: PublicKey, selected: string) {
    const address = programId.toBase58();
    return customIdlStorage.put({
        programAddress: address,
        value: JSON.stringify({ idl: { ...anchorModernIdl, address }, origin: { kind: 'pasted' }, selected }),
    });
}

function renderSection(ix: TransactionInstruction, compiledInnerInstructions?: CompiledInnerInstruction[]) {
    return render(
        <JotaiProvider store={createStore()}>
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <TransactionsProvider>
                        <AccountsProvider>
                            <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                                <InstructionsSection
                                    message={buildMessage(ix)}
                                    compiledInnerInstructions={compiledInnerInstructions}
                                />
                            </InstructionParserProvider>
                        </AccountsProvider>
                    </TransactionsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        </JotaiProvider>,
    );
}

// The inner program is an account of the outer instruction, so the message has an index for it.
function renderSectionWithInner(ix: TransactionInstruction, innerProgram: PublicKey) {
    const keys = [...ix.keys, { isSigner: false, isWritable: false, pubkey: innerProgram }];
    const outerIx = new TransactionInstruction({ data: ix.data, keys, programId: ix.programId });
    const programIdIndex = buildMessage(outerIx).staticAccountKeys.findIndex(key => key.equals(innerProgram));
    const data = getBase58Decoder().decode(Uint8Array.from([1]));
    return renderSection(outerIx, [{ index: 0, instructions: [{ accounts: [], data, programIdIndex }] }]);
}

function buildMessage(ix: TransactionInstruction): MessageV0 {
    return new TransactionMessage({
        instructions: [ix],
        payerKey: PAYER,
        recentBlockhash: PublicKey.default.toBase58(),
    }).compileToV0Message();
}

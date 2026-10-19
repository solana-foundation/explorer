import { DEFAULT_SIGNATURE, gen } from '@__fixtures__/gen';
import { customIdlStorage } from '@entities/idl/api/custom-idl-storage';
import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import { getBase58Decoder } from '@solana/kit';
import {
    ComputeBudgetProgram,
    type ParsedInstruction,
    type ParsedTransaction,
    type PartiallyDecodedInstruction,
    PublicKey,
    SystemProgram,
} from '@solana/web3.js';
import { render, screen, waitFor } from '@testing-library/react';
import { INNER_INSTRUCTIONS_START_SLOT } from '@utils/index';
import { createStore, Provider as JotaiProvider } from 'jotai';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { InstructionParserProvider } from '@/app/entities/instruction-parser';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';

import { InstructionsSection } from '../InstructionsSection';

const BASE58_DECODER = getBase58Decoder();
const PAYER = gen.publicKey(0);
const DEVI = new PublicKey(anchorModernIdl.address);
const CREATE_AMM_CONFIG = [137, 52, 237, 212, 215, 117, 108, 104];

const CREATE_AMM_CONFIG_IX = instruction(DEVI, [...CREATE_AMM_CONFIG, ...new Array(16).fill(0)], 3);
const SET_COMPUTE_UNIT_LIMIT_IX = instruction(ComputeBudgetProgram.programId, [2, 64, 13, 3, 0], 0);
const PARSED_TRANSFER_IX: ParsedInstruction = {
    parsed: {
        info: { destination: gen.publicKey(1).toBase58(), lamports: 1, source: PAYER.toBase58() },
        type: 'transfer',
    },
    program: 'system',
    programId: SystemProgram.programId,
};

const mocks = vi.hoisted(() => ({
    onChainIdls: undefined as unknown,
    throwingProgram: 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo',
}));
let transactionWithMeta: { meta: unknown; slot: number; transaction: ParsedTransaction };

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

vi.mock('swr/immutable', () => ({
    __esModule: true,
    default: vi.fn((key: unknown) => ({
        data: Array.isArray(key) && key[0] === 'program-idls' ? mocks.onChainIdls : undefined,
        isLoading: false,
    })),
}));

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

vi.mock('@providers/transactions', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/transactions')>()),
    useTransactionDetails: vi.fn(() => ({ data: { transactionWithMeta } })),
    useTransactionStatus: vi.fn(() => ({ data: { info: { result: { err: null } } } })),
}));

describe('Transaction page InstructionsSection with a custom IDL', () => {
    beforeEach(() => {
        mocks.onChainIdls = undefined;
    });

    test('should decode with the selected custom IDL and show its highlighted selector', async () => {
        await storeCustomIdl(DEVI, 'custom');
        renderSection([CREATE_AMM_CONFIG_IX]);

        expect(await screen.findByText('Create Amm Config', { exact: false })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'IDL: Custom' }).className).toContain('amber');
    });

    test('should show the failure row, not the on-chain decode, when the custom IDL lacks the instruction', async () => {
        mocks.onChainIdls = { anchorIdl: renamedIdl('on_chain_instruction'), programMetadataIdl: undefined };
        await storeCustomIdl(DEVI, 'custom', {
            ...anchorModernIdl,
            instructions: anchorModernIdl.instructions.slice(1),
        });
        renderSection([CREATE_AMM_CONFIG_IX]);

        expect(await screen.findByText('The custom IDL could not decode this instruction.')).toBeInTheDocument();
        expect(screen.queryByText('On Chain Instruction', { exact: false })).not.toBeInTheDocument();
    });

    test('should take precedence over the Explorer decoder of the program', async () => {
        await storeCustomIdl(ComputeBudgetProgram.programId, 'custom');
        renderSection([SET_COMPUTE_UNIT_LIMIT_IX]);

        expect(await screen.findByText('The custom IDL could not decode this instruction.')).toBeInTheDocument();
        expect(screen.queryByText('Set Compute Unit Limit', { exact: false })).not.toBeInTheDocument();
    });

    test('should not render the Explorer decode before the store reads the custom selection', async () => {
        await storeCustomIdl(ComputeBudgetProgram.programId, 'custom');
        const rendered: string[] = [];
        const observer = new MutationObserver(() => rendered.push(document.body.textContent ?? ''));
        observer.observe(document.body, { characterData: true, childList: true, subtree: true });

        renderSection([SET_COMPUTE_UNIT_LIMIT_IX]);

        expect(screen.getByText('Loading instruction')).toBeInTheDocument();
        await screen.findByText('The custom IDL could not decode this instruction.');
        observer.disconnect();
        expect(rendered.some(text => text.includes('Set Compute Unit Limit'))).toBe(false);
    });

    test('should show the selector, not highlighted, on an Explorer decoder card when the on-chain IDL is selected', async () => {
        await storeCustomIdl(ComputeBudgetProgram.programId, 'onChain');
        renderSection([SET_COMPUTE_UNIT_LIMIT_IX]);

        expect(await screen.findByText('Set Compute Unit Limit', { exact: false })).toBeInTheDocument();
        const selector = await screen.findByRole('button', { name: 'IDL: None' });
        expect(selector.className).not.toContain('amber');
    });

    test('should show no selector for a program without a custom IDL', async () => {
        await storeCustomIdl(DEVI, 'custom');
        renderSection([SET_COMPUTE_UNIT_LIMIT_IX]);

        expect(await screen.findByText('Set Compute Unit Limit', { exact: false })).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole('button', { name: 'IDL: None' })).not.toBeInTheDocument());
        expect(screen.queryByRole('button', { name: 'IDL: Custom' })).not.toBeInTheDocument();
    });

    test('should show no selector for an instruction the RPC parsed', async () => {
        await storeCustomIdl(DEVI, 'custom');
        await storeCustomIdl(SystemProgram.programId, 'custom');
        renderSection([CREATE_AMM_CONFIG_IX], [PARSED_TRANSFER_IX]);

        expect(await screen.findByText('Create Amm Config', { exact: false })).toBeInTheDocument();
        expect(screen.getByText('#1.1')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'IDL: Custom' })).toHaveLength(1);
    });

    test('should not show the parent program selector on the fallback card of an inner instruction', async () => {
        await storeCustomIdl(DEVI, 'custom');
        renderSection([CREATE_AMM_CONFIG_IX], [instruction(new PublicKey(mocks.throwingProgram), [1], 0)]);

        expect(await screen.findByText('Create Amm Config', { exact: false })).toBeInTheDocument();
        expect(await screen.findByText('#1.1')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'IDL: Custom' })).toHaveLength(1);
    });

    test('should show the inner program selector on the fallback card of an inner instruction', async () => {
        await storeCustomIdl(DEVI, 'custom');
        await storeCustomIdl(new PublicKey(mocks.throwingProgram), 'onChain');
        renderSection([CREATE_AMM_CONFIG_IX], [instruction(new PublicKey(mocks.throwingProgram), [1], 0)]);

        expect(await screen.findByText('#1.1')).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: 'IDL: None' })).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'IDL: Custom' })).toHaveLength(1);
    });

    test('should show no selector on the fallback card of an inner instruction the RPC parsed', async () => {
        await storeCustomIdl(DEVI, 'custom');
        await storeCustomIdl(new PublicKey(mocks.throwingProgram), 'onChain');
        const parsedMemoIx: ParsedInstruction = {
            parsed: 'memo',
            program: 'spl-memo',
            programId: new PublicKey(mocks.throwingProgram),
        };
        renderSection([CREATE_AMM_CONFIG_IX], [parsedMemoIx]);

        expect(await screen.findByText('Create Amm Config', { exact: false })).toBeInTheDocument();
        expect(await screen.findByText('#1.1')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'IDL: None' })).not.toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'IDL: Custom' })).toHaveLength(1);
    });

    test('should render the custom decode as the first decode of the instruction', async () => {
        mocks.onChainIdls = { anchorIdl: renamedIdl('on_chain_instruction'), programMetadataIdl: undefined };
        await storeCustomIdl(DEVI, 'custom');
        const rendered: string[] = [];
        const observer = new MutationObserver(() => rendered.push(document.body.textContent ?? ''));
        observer.observe(document.body, { characterData: true, childList: true, subtree: true });

        renderSection([CREATE_AMM_CONFIG_IX]);

        await screen.findByText('Create Amm Config', { exact: false });
        observer.disconnect();
        expect(rendered.some(text => text.includes('On Chain Instruction'))).toBe(false);
    });
});

function instruction(programId: PublicKey, data: number[], accountCount: number): PartiallyDecodedInstruction {
    const accounts = Array.from({ length: accountCount }, (_, index) => gen.publicKey(index + 10));
    return { accounts, data: encode(data), programId };
}

function encode(data: number[]): string {
    return BASE58_DECODER.decode(new Uint8Array(data));
}

function renamedIdl(name: string) {
    const [first, ...rest] = anchorModernIdl.instructions;
    return { ...anchorModernIdl, instructions: [{ ...first, name }, ...rest] };
}

function storeCustomIdl(programId: PublicKey, selected: string, baseIdl: object = anchorModernIdl) {
    const address = programId.toBase58();
    const idl = { ...baseIdl, address };
    return customIdlStorage.put({
        programAddress: address,
        value: JSON.stringify({ idl, origin: { kind: 'pasted' }, selected }),
    });
}

function renderSection(
    instructions: PartiallyDecodedInstruction[],
    inner: (ParsedInstruction | PartiallyDecodedInstruction)[] = [],
) {
    transactionWithMeta = {
        meta: { innerInstructions: [{ index: 0, instructions: inner }] },
        slot: INNER_INSTRUCTIONS_START_SLOT,
        transaction: {
            message: {
                accountKeys: [PAYER, ...instructions.flatMap(ix => ix.accounts)].map(pubkey => ({
                    pubkey,
                    signer: pubkey.equals(PAYER),
                    source: 'transaction',
                    writable: true,
                })),
                addressTableLookups: null,
                instructions,
                recentBlockhash: PublicKey.default.toBase58(),
            },
            signatures: [DEFAULT_SIGNATURE],
        } as unknown as ParsedTransaction,
    };

    return render(
        <JotaiProvider store={createStore()}>
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <TransactionsProvider>
                        <AccountsProvider>
                            <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                                <InstructionsSection signature={DEFAULT_SIGNATURE} />
                            </InstructionParserProvider>
                        </AccountsProvider>
                    </TransactionsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        </JotaiProvider>,
    );
}

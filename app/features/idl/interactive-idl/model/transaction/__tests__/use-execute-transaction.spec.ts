import { useWallet } from '@solana/wallet-adapter-react';
import type { Connection } from '@solana/web3.js';
import { Keypair, PublicKey, SendTransactionError, Transaction, TransactionInstruction } from '@solana/web3.js';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BroadcastFailedResult, ExecutionOkResult, PreBroadcastFailedResult } from '../types';
import { useExecuteTransaction } from '../use-execute-transaction';

vi.mock('@solana/wallet-adapter-react');
vi.mock('@/app/providers/cluster', () => ({
    useCluster: () => ({ cluster: 'devnet' }),
}));

const PK = Keypair.generate().publicKey;

function mockConnection(overrides: Partial<Connection> = {}) {
    return {
        confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
        getLatestBlockhash: vi
            .fn()
            .mockResolvedValue({ blockhash: PublicKey.default.toBase58(), lastValidBlockHeight: 100 }),
        getTransaction: vi.fn().mockResolvedValue({ meta: { logMessages: ['final-log'] } }),
        sendRawTransaction: vi.fn().mockResolvedValue('sig123'),
        simulateTransaction: vi.fn().mockResolvedValue({ context: { slot: 1 }, value: { err: null, logs: ['s'] } }),
        ...overrides,
    } as unknown as Connection;
}

function makeTx(): Transaction {
    const tx = new Transaction();
    tx.feePayer = PK;
    tx.add(
        new TransactionInstruction({
            data: Buffer.from([]),
            keys: [],
            programId: PublicKey.default,
        }),
    );
    return tx;
}

function mockWallet(connected = true) {
    vi.mocked(useWallet).mockReturnValue({
        connected,
        publicKey: connected ? PK : null,
        signAllTransactions: vi.fn(),
        signTransaction: vi.fn(async (tx: any) => ({ ...tx, serialize: () => new Uint8Array() })),
    } as unknown as ReturnType<typeof useWallet>);
}

describe('useExecuteTransaction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockWallet(true);
    });

    it('should sign, send, confirm, and set lastResult.success with final logs on happy path', async () => {
        const connection = mockConnection();
        const onSuccess = vi.fn();
        const { result } = renderHook(() =>
            useExecuteTransaction({
                commitment: 'confirmed',
                connection: connection,
                onSuccess,
            }),
        );
        await act(async () => {
            await result.current.executeTx(async () => makeTx());
        });
        await waitFor(() => expect(result.current.lastResult?.status).toBe('success'));
        expect((result.current.lastResult as ExecutionOkResult).signature).toBe('sig123');
        expect(result.current.lastResult?.logs).toEqual(['final-log']);
        expect(onSuccess).toHaveBeenCalledWith('sig123');
    });

    it('should decode IDL error name and surface fetched logs on on-chain failure', async () => {
        const connection = mockConnection({
            confirmTransaction: vi
                .fn()
                .mockResolvedValue({ value: { err: { InstructionError: [0, { Custom: 6001 }] } } }),
            getTransaction: vi.fn().mockResolvedValue({ meta: { logMessages: ['failed-log'] } }),
        });
        const { result } = renderHook(() =>
            useExecuteTransaction({
                commitment: 'confirmed',
                connection: connection,
                idlErrors: [{ code: 6001, name: 'AlreadyInitialized' }],
            }),
        );
        await act(async () => {
            await result.current.executeTx(async () => makeTx());
        });
        await waitFor(() => expect(result.current.lastResult?.status).toBe('error'));
        expect(result.current.lastResult?.logs).toEqual(['failed-log']);
        expect((result.current.lastResult as BroadcastFailedResult).message).toContain(
            'Instruction #1 got "AlreadyInitialized"',
        );
    });

    it('should fire onPreExecutionError when wallet is disconnected and not call signTransaction', async () => {
        mockWallet(false);
        const connection = mockConnection();
        const onPreExecutionError = vi.fn();
        const { result } = renderHook(() =>
            useExecuteTransaction({
                commitment: 'confirmed',
                connection: connection,
                onPreExecutionError,
            }),
        );
        await act(async () => {
            await result.current.executeTx(async () => makeTx());
        });
        expect(onPreExecutionError).toHaveBeenCalledWith('Wallet not connected');
        expect(connection.sendRawTransaction).not.toHaveBeenCalled();
    });

    it('should set lastResult.error on confirmation error with unstructured err', async () => {
        const connection = mockConnection({
            confirmTransaction: vi.fn().mockResolvedValue({ value: { err: 'oops' } }),
            getTransaction: vi.fn().mockResolvedValue({ meta: { logMessages: ['l'] } }),
        });
        const { result } = renderHook(() =>
            useExecuteTransaction({
                commitment: 'confirmed',
                connection: connection,
            }),
        );
        await act(async () => {
            await result.current.executeTx(async () => makeTx());
        });
        await waitFor(() => expect(result.current.lastResult?.status).toBe('error'));
        const r = result.current.lastResult as BroadcastFailedResult;
        expect(r.phase).toBe('broadcast_failed');
        expect(r.signature).toBe('sig123');
    });

    it('should surface builder errors as lastResult.error and fire onError without calling RPC', async () => {
        const connection = mockConnection();
        const onError = vi.fn();
        const { result } = renderHook(() =>
            useExecuteTransaction({
                commitment: 'confirmed',
                connection: connection,
                onError,
            }),
        );
        await act(async () => {
            await result.current.executeTx(async () => {
                throw new Error('UnexpectedError');
            });
        });
        await waitFor(() => expect(result.current.lastResult?.status).toBe('error'));
        expect((result.current.lastResult as PreBroadcastFailedResult).message).toBe('UnexpectedError');
        expect(result.current.isExecuting).toBe(false);
        expect(onError).toHaveBeenCalledWith('UnexpectedError', undefined);
        expect(connection.sendRawTransaction).not.toHaveBeenCalled();
        const r = result.current.lastResult as PreBroadcastFailedResult;
        expect(r.phase).toBe('pre_broadcast_failed');
        expect(r.serializedTxMessage).toBeUndefined();
    });

    it('should capture logs from SendTransactionError when sendRawTransaction rejects', async () => {
        const preflightLogs = [
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program failed to complete: custom program error: 0x1',
        ];
        const sendError = new SendTransactionError({
            action: 'send',
            logs: preflightLogs,
            signature: '',
            transactionMessage: 'preflight failure',
        });
        const connection = mockConnection({
            sendRawTransaction: vi.fn().mockRejectedValue(sendError),
        });
        const onError = vi.fn();
        const { result } = renderHook(() =>
            useExecuteTransaction({
                commitment: 'confirmed',
                connection: connection,
                onError,
            }),
        );

        await act(async () => {
            await result.current.executeTx(async () => makeTx());
        });

        await waitFor(() => expect(result.current.lastResult?.status).toBe('error'));
        const r = result.current.lastResult as PreBroadcastFailedResult;
        expect(r.phase).toBe('pre_broadcast_failed');
        expect(r.logs).toEqual(preflightLogs);
        expect(r.message).toBe(sendError.message);
        expect(connection.confirmTransaction).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledWith(sendError.message, undefined);
    });

    it('should set phase broadcast_failed when getTransaction rejects after the tx was broadcast', async () => {
        const connection = mockConnection({
            getTransaction: vi.fn().mockRejectedValue(new Error('rpc timeout')),
        });
        const { result } = renderHook(() =>
            useExecuteTransaction({
                commitment: 'confirmed',
                connection: connection,
            }),
        );
        await act(async () => {
            await result.current.executeTx(async () => makeTx());
        });
        await waitFor(() => expect(result.current.lastResult?.status).toBe('error'));
        const r = result.current.lastResult as BroadcastFailedResult;
        expect(r.phase).toBe('broadcast_failed');
        expect(r.signature).toBe('sig123');
        expect(r.message).toBe('rpc timeout');
        expect(r.serializedTxMessage.length).toBeGreaterThan(0);
    });
});

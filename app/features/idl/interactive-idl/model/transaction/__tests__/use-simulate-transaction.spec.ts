import type { Connection } from '@solana/web3.js';
import { Keypair, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RpcSimulationFailedResult, SimulationExecutionFailedResult, SimulationOkResult } from '../types';
import { useSimulateTransaction } from '../use-simulate-transaction';

vi.mock('@/app/providers/cluster', () => ({
    useCluster: () => ({ cluster: 'devnet' }),
}));

function mockConnection(simReturn: Record<string, unknown>) {
    return {
        getLatestBlockhash: vi.fn().mockResolvedValue({
            blockhash: PublicKey.default.toBase58(),
            lastValidBlockHeight: 1,
        }),
        simulateTransaction: vi.fn().mockResolvedValue(simReturn),
    };
}

function makeTx(): Transaction {
    const tx = new Transaction();
    tx.feePayer = Keypair.generate().publicKey;
    tx.add(
        new TransactionInstruction({
            data: Buffer.from([]),
            keys: [],
            programId: PublicKey.default,
        }),
    );
    return tx;
}

describe('useSimulateTransaction', () => {
    beforeEach(() => vi.clearAllMocks());

    it('should set lastSimulation.status === "success" with logs on happy path', async () => {
        const conn = mockConnection({
            context: { slot: 1 },
            value: { err: null, logs: ['l1'], returnData: null, unitsConsumed: 100 },
        });
        const { result } = renderHook(() =>
            useSimulateTransaction({ connection: conn as unknown as Connection, simulationCommitment: 'processed' }),
        );
        await act(async () => {
            await result.current.simulate(async () => makeTx());
        });
        await waitFor(() => expect(result.current.lastSimulation?.status).toBe('success'));
        expect((result.current.lastSimulation as SimulationOkResult).logs).toEqual(['l1']);
    });

    it('should surface simulation logs before throwing on error path', async () => {
        const conn = mockConnection({
            context: { slot: 1 },
            value: { err: { InstructionError: [0, { Custom: 6001 }] }, logs: ['log-on-err'] },
        });
        const { result } = renderHook(() =>
            useSimulateTransaction({
                connection: conn as unknown as Connection,
                idlErrors: [{ code: 6001, name: 'AlreadyInitialized' }],
                simulationCommitment: 'processed',
            }),
        );
        await act(async () => {
            await result.current.simulate(async () => makeTx());
        });
        await waitFor(() => expect(result.current.lastSimulation?.status).toBe('error'));
        expect((result.current.lastSimulation as RpcSimulationFailedResult).logs).toEqual(['log-on-err']);
        expect((result.current.lastSimulation as RpcSimulationFailedResult).message).toContain('AlreadyInitialized');
        expect((result.current.lastSimulation as RpcSimulationFailedResult).phase).toBe('rpc_simulation_failed');
    });

    it('should set error state when builder throws without invoking RPC', async () => {
        const conn = mockConnection({ context: { slot: 1 }, value: { err: null, logs: [] } });
        const { result } = renderHook(() =>
            useSimulateTransaction({ connection: conn as unknown as Connection, simulationCommitment: 'processed' }),
        );
        await act(async () => {
            await result.current.simulate(async () => {
                throw new Error('build failed');
            });
        });
        await waitFor(() => expect(result.current.lastSimulation?.status).toBe('error'));
        expect((result.current.lastSimulation as SimulationExecutionFailedResult).message).toBe('build failed');
        expect(conn.simulateTransaction).not.toHaveBeenCalled();
    });

    it('should populate serializedTxMessage on the success result', async () => {
        const conn = mockConnection({
            context: { slot: 1 },
            value: { err: null, logs: [], returnData: null, unitsConsumed: 0 },
        });
        const { result } = renderHook(() =>
            useSimulateTransaction({ connection: conn as unknown as Connection, simulationCommitment: 'processed' }),
        );
        await act(async () => {
            await result.current.simulate(async () => makeTx());
        });
        await waitFor(() => expect(result.current.lastSimulation?.status).toBe('success'));
        expect(result.current.lastSimulation?.serializedTxMessage).toEqual(expect.any(String));
        expect(result.current.lastSimulation?.serializedTxMessage?.length).toBeGreaterThan(0);
    });

    it('should populate serializedTxMessage on the RPC-error result', async () => {
        const conn = mockConnection({
            context: { slot: 1 },
            value: { err: { InstructionError: [0, 'Custom'] }, logs: [] },
        });
        const { result } = renderHook(() =>
            useSimulateTransaction({ connection: conn as unknown as Connection, simulationCommitment: 'processed' }),
        );
        await act(async () => {
            await result.current.simulate(async () => makeTx());
        });
        await waitFor(() => expect(result.current.lastSimulation?.status).toBe('error'));
        expect(result.current.lastSimulation?.serializedTxMessage).toEqual(expect.any(String));
        expect((result.current.lastSimulation as RpcSimulationFailedResult).phase).toBe('rpc_simulation_failed');
    });

    it('should set serializedTxMessage to null when the builder throws before serialization', async () => {
        const conn = mockConnection({ context: { slot: 1 }, value: { err: null, logs: [] } });
        const { result } = renderHook(() =>
            useSimulateTransaction({ connection: conn as unknown as Connection, simulationCommitment: 'processed' }),
        );
        await act(async () => {
            await result.current.simulate(async () => {
                throw new Error('build failed');
            });
        });
        await waitFor(() => expect(result.current.lastSimulation?.status).toBe('error'));
        expect(result.current.lastSimulation?.serializedTxMessage).toBeUndefined();
        expect((result.current.lastSimulation as SimulationExecutionFailedResult).phase).toBe(
            'simulation_execution_failed',
        );
    });
});

// @vitest-environment jsdom

import type { Connection } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { waitForHook } from '@/app/__tests__/swr-hook';

import type { RpcSimulationFailedResult, SimulationExecutionFailedResult, SimulationOkResult } from '../types';
import { useSimulateTransaction } from '../use-simulate-transaction';
import { makeTx } from './utils';

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

describe('useSimulateTransaction', () => {
    beforeEach(() => vi.clearAllMocks());

    it('should set lastSimulation.status === "success" with logs and serializedTxMessage on happy path', async () => {
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
        await waitForHook(() => expect(result.current.lastSimulation?.status).toBe('success'));
        expect((result.current.lastSimulation as SimulationOkResult).logs.raw).toEqual(['l1']);
        expect(result.current.lastSimulation?.serializedTxMessage).toEqual(expect.any(String));
        expect(result.current.lastSimulation?.serializedTxMessage?.length).toBeGreaterThan(0);
    });

    it('should surface simulation logs and serializedTxMessage before throwing on error path', async () => {
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
        await waitForHook(() => expect(result.current.lastSimulation?.status).toBe('error'));
        expect((result.current.lastSimulation as RpcSimulationFailedResult).logs.raw).toEqual(['log-on-err']);
        expect((result.current.lastSimulation as RpcSimulationFailedResult).message).toContain('AlreadyInitialized');
        expect((result.current.lastSimulation as RpcSimulationFailedResult).phase).toBe('rpc_simulation_failed');
        expect(result.current.lastSimulation?.serializedTxMessage).toEqual(expect.any(String));
    });

    it('should set error state without serializedTxMessage when builder throws without invoking RPC', async () => {
        const conn = mockConnection({ context: { slot: 1 }, value: { err: null, logs: [] } });
        const { result } = renderHook(() =>
            useSimulateTransaction({ connection: conn as unknown as Connection, simulationCommitment: 'processed' }),
        );
        await act(async () => {
            await result.current.simulate(async () => {
                throw new Error('build failed');
            });
        });
        await waitForHook(() => expect(result.current.lastSimulation?.status).toBe('error'));
        expect((result.current.lastSimulation as SimulationExecutionFailedResult).message).toBe('build failed');
        expect(conn.simulateTransaction).not.toHaveBeenCalled();
        expect(result.current.lastSimulation?.serializedTxMessage).toBeUndefined();
        expect((result.current.lastSimulation as SimulationExecutionFailedResult).phase).toBe(
            'simulation_execution_failed',
        );
    });
});

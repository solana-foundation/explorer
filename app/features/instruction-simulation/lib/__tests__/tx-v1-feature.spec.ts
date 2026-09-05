import type { SolanaRpc } from '@entities/cluster';
import { describe, expect, it, vi } from 'vitest';

import { toBase64 } from '@/app/shared/lib/bytes';

import { ENABLE_TX_V1_FEATURE, isTxV1Active } from '../tx-v1-feature';

function rpcReturning(data: Uint8Array | null): SolanaRpc {
    return {
        getAccountInfo: vi.fn().mockReturnValue({
            send: vi.fn().mockResolvedValue({ value: data === null ? null : { data: [toBase64(data), 'base64'] } }),
        }),
    } as unknown as SolanaRpc;
}

describe('isTxV1Active', () => {
    it('should report active when the gate carries an activation slot', async () => {
        const activatedAtSlot = new Uint8Array([1, 42, 0, 0, 0, 0, 0, 0, 0]);

        await expect(isTxV1Active(rpcReturning(activatedAtSlot))).resolves.toBe(true);
    });

    it('should report inactive when the gate is staged but not activated', async () => {
        await expect(isTxV1Active(rpcReturning(new Uint8Array(9)))).resolves.toBe(false);
    });

    it('should report inactive when the feature account does not exist', async () => {
        await expect(isTxV1Active(rpcReturning(null))).resolves.toBe(false);
    });

    it('should read the transaction v1 feature account', async () => {
        const rpc = rpcReturning(new Uint8Array(9));

        await isTxV1Active(rpc);

        expect(rpc.getAccountInfo).toHaveBeenCalledWith(
            ENABLE_TX_V1_FEATURE,
            expect.objectContaining({ encoding: 'base64' }),
        );
    });
});

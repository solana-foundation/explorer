import type { Connection } from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

import { ENABLE_TX_V1_FEATURE, isTxV1Active } from '../tx-v1-feature';

function connectionReturning(data: Uint8Array | null): Connection {
    return {
        getAccountInfo: vi.fn().mockResolvedValue(data === null ? null : { data: Buffer.from(data) }),
    } as unknown as Connection;
}

describe('isTxV1Active', () => {
    it('should report active when the gate carries an activation slot', async () => {
        const activatedAtSlot = new Uint8Array([1, 42, 0, 0, 0, 0, 0, 0, 0]);

        await expect(isTxV1Active(connectionReturning(activatedAtSlot))).resolves.toBe(true);
    });

    it('should report inactive when the gate is staged but not activated', async () => {
        await expect(isTxV1Active(connectionReturning(new Uint8Array(9)))).resolves.toBe(false);
    });

    it('should report inactive when the feature account does not exist', async () => {
        await expect(isTxV1Active(connectionReturning(null))).resolves.toBe(false);
    });

    it('should read the transaction v1 feature account', async () => {
        const connection = connectionReturning(new Uint8Array(9));

        await isTxV1Active(connection);

        expect(connection.getAccountInfo).toHaveBeenCalledWith(ENABLE_TX_V1_FEATURE);
    });
});

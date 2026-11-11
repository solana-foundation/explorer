import { PublicKey } from '@solana/web3.js';
import { generated, getVaultPda } from '@sqds/multisig';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';
import type { Account } from '@/app/providers/accounts';
import { fromBase64 } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';

import type { SquadsAccountType } from '../SquadsAccountSection';
import { useSquadsMultisigAddresses } from '../use-squads-multisig-addresses';

// From Squads batch account Ap4q9ALq7Yr55tot7HWzfoPPpFH1bPYP1F6QWiKRJM9
const BATCH_DATA = fromBase64(
    'nMJGLBZYiSybtkqiyGg4Qb1ffK+usZowFIrIYA+HgzA35nU45ih9IMiPKlWM4B4vRyDQpY8Um53tFJiCtVFOb6Y5NFv8qc3ngQAAAAAAAAD+APwCAAAAAgAAAA==',
);

// From Squads vault transaction account ASwDJP5mzxV1dfov2eQz5WAVEy833nwK17VLcjsrZsZf
const VAULT_TRANSACTION_DATA = fromBase64(
    'qPqiZFEOos+fErS/xkrbJRCvXG3UbwrUsJlVxCt0e4xgzjQyewfzMULyaPFkYPsCiNMe9FN//udpL5PwKAM/1qdskrvY+9nLCAAAAAAAAAD/AP8AAAAAAQEECAAAANCjHLRKvgiq2AoZK5QSGOfYj5bTGybeyAspA1+XDrVyM90v0fImaE0NQYcSinPuk++6GJEe5cKJZ4w9p0mAYgkJKhPulcQcugimf1rGfo334doRYl4dZBN/j08jgwN/FDCuVi3sTsjyvqU+oP8oI/e92Q78flUtkwuKGo3ug/s7V4efG9ifzqH+b9ldMvB714n0oZVW1d6xudyfhcoWP+0CqPaRToihsOIQFT73Y64rAMK5PRbBJNLAU3oQBIAAAAan1RcZLFxRIYzJTD1K8X9Y2u4Im6H9ROPb2YoAAAAABqfVFxjHdMkoVmOYaR1etoteuKObS21cc1VbIQAAAAABAAAABQcAAAABAgMEBgcABAAAAAMAAAAAAAAA',
);

describe('useSquadsMultisigAddresses', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should derive the multisig and vault of a Batch account', async () => {
        const [batch] = generated.Batch.deserialize(Buffer.from(BATCH_DATA));

        const { result } = renderMultisigAddressesHook(BATCH_DATA, 'batch');

        await waitForHook(() =>
            expect(result.current).toEqual({
                multisig: batch.multisig,
                vault: getVaultPda({ index: batch.vaultIndex, multisigPda: batch.multisig })[0],
            }),
        );
        expect(result.current?.vault.toBase58()).toBe('GhcyhaiSvr6Sd9FDp5Bpe4LT4ny4WqZfwZEvnFxAgMgE');
    });

    it('should derive the multisig and vault of a VaultTransaction account', async () => {
        const { result } = renderMultisigAddressesHook(VAULT_TRANSACTION_DATA, 'vaultTransaction');

        await waitForHook(() =>
            expect(result.current?.vault.toBase58()).toBe('F3S4PD17Eo3FyCMropzDLCpBFuQuBmufUVBBdKEHbQFT'),
        );
        expect(result.current?.multisig.toBase58()).toBe('BhxNKqwmF7MT5pWBterrwv7a5GVHFRCk4Y51y7QGeHV2');
    });

    it('should derive the vault from the vault index stored in the account', async () => {
        const data = Uint8Array.from(BATCH_DATA);
        data[81] = 3;
        const [batch] = generated.Batch.deserialize(Buffer.from(data));

        const { result } = renderMultisigAddressesHook(data, 'batch');

        expect(batch.vaultIndex).toBe(3);
        await waitForHook(() =>
            expect(result.current?.vault).toEqual(getVaultPda({ index: 3, multisigPda: batch.multisig })[0]),
        );
    });

    it('should log and derive nothing when the account data cannot be decoded', async () => {
        const logError = vi.spyOn(Logger, 'error').mockImplementation(() => undefined);

        const { result } = renderMultisigAddressesHook(BATCH_DATA.subarray(0, 40), 'batch');

        await waitForHook(() => expect(logError).toHaveBeenCalledTimes(1));
        expect(result.current).toBeUndefined();
    });
});

function renderMultisigAddressesHook(raw: Uint8Array, accountType: SquadsAccountType) {
    return renderHook(() => useSquadsMultisigAddresses(squadsAccount(raw), accountType), { wrapper: swrWrapper() });
}

function squadsAccount(raw: Uint8Array): Account {
    return {
        data: { raw },
        executable: false,
        lamports: 0,
        owner: new PublicKey('SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf'),
        pubkey: PublicKey.default,
    };
}

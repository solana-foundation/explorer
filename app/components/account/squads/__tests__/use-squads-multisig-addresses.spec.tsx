import { generated, getVaultPda } from '@sqds/multisig';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';
import { Logger } from '@/app/shared/lib/logger';

import type { SquadsAccountType } from '../SquadsAccountSection';
import { useSquadsMultisigAddresses } from '../use-squads-multisig-addresses';
import { BATCH_DATA, makeSquadsAccount, VAULT_TRANSACTION_DATA } from './__fixtures__/squads-accounts';

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
    return renderHook(() => useSquadsMultisigAddresses(makeSquadsAccount(raw), accountType), {
        wrapper: swrWrapper(),
    });
}

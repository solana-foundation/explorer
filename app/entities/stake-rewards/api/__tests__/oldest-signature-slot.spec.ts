import { gen } from '@__fixtures__/gen';
import { type Address, type GetSignaturesForAddressApi, type Rpc } from '@solana/kit';
import { describe, expect, it, vi } from 'vitest';

import { getOldestSignatureSlot, SignatureHistoryUnavailableError } from '../oldest-signature-slot';

const ADDRESS = gen.vanityAddress('STAKE') as Address;

describe('getOldestSignatureSlot', () => {
    it('should return the oldest slot on the page', async () => {
        const rpc = makeRpc([[437_000_000n, 420_000_000n, 407_506_361n]]);

        await expect(getOldestSignatureSlot({ address: ADDRESS, rpc })).resolves.toBe(407_506_361n);
    });

    it('should read the oldest slot whatever order the RPC returns the page in', async () => {
        const rpc = makeRpc([[407_506_361n, 437_000_000n, 420_000_000n]]);

        await expect(getOldestSignatureSlot({ address: ADDRESS, rpc })).resolves.toBe(407_506_361n);
    });

    it('should stop after one page when the page comes back short', async () => {
        const rpc = makeRpc([[407_506_361n]]);

        await getOldestSignatureSlot({ address: ADDRESS, rpc });

        expect(rpc.getSignaturesForAddress).toHaveBeenCalledTimes(1);
    });

    it('should page back past a full page rather than give up on it', async () => {
        // The bug this replaces: a full page used to end the walk and fall back to the activation
        // epoch, reporting a short total for exactly the accounts with the longest histories.
        const rpc = makeRpc([fullPage(437_000_000n), [364_763_481n]]);

        await expect(getOldestSignatureSlot({ address: ADDRESS, rpc })).resolves.toBe(364_763_481n);
        expect(rpc.getSignaturesForAddress).toHaveBeenCalledTimes(2);
    });

    it('should page back from the oldest signature of the page it just read', async () => {
        const rpc = makeRpc([fullPage(437_000_000n), [364_763_481n]]);

        await getOldestSignatureSlot({ address: ADDRESS, rpc });

        // The page runs newest first, so its cursor is the last entry.
        expect(rpc.getSignaturesForAddress).toHaveBeenLastCalledWith(
            ADDRESS,
            expect.objectContaining({ before: `sig-${437_000_000n - 999n}` }),
        );
    });

    it('should throw rather than answer from a history it could not reach the end of', async () => {
        const rpc = makeRpc(Array.from({ length: 6 }, (_, page) => fullPage(437_000_000n - BigInt(page * 1000))));

        await expect(getOldestSignatureSlot({ address: ADDRESS, rpc })).rejects.toThrow(
            SignatureHistoryUnavailableError,
        );
    });

    it('should stop paging once it has given up, rather than walk on', async () => {
        const rpc = makeRpc(Array.from({ length: 6 }, (_, page) => fullPage(437_000_000n - BigInt(page * 1000))));

        await expect(getOldestSignatureSlot({ address: ADDRESS, rpc })).rejects.toThrow();

        expect(rpc.getSignaturesForAddress).toHaveBeenCalledTimes(5);
    });

    it('should throw when the account has no signatures to date it by', async () => {
        const rpc = makeRpc([[]]);

        await expect(getOldestSignatureSlot({ address: ADDRESS, rpc })).rejects.toThrow(
            SignatureHistoryUnavailableError,
        );
    });

    it('should pass the abort signal to every page', async () => {
        const rpc = makeRpc([fullPage(437_000_000n), [364_763_481n]]);
        const abortSignal = AbortSignal.timeout(10_000);

        await getOldestSignatureSlot({ abortSignal, address: ADDRESS, rpc });

        expect(rpc.send).toHaveBeenCalledTimes(2);
        expect(rpc.send).toHaveBeenCalledWith({ abortSignal });
    });
});

/** A page at the limit, which cannot be the end of the history. */
function fullPage(newestSlot: bigint): bigint[] {
    return Array.from({ length: 1_000 }, (_, index) => newestSlot - BigInt(index));
}

/** An rpc that serves `pages` in order, newest page first, as `getSignaturesForAddress` does. */
function makeRpc(pages: bigint[][]) {
    const send = vi.fn();
    for (const page of pages) {
        send.mockResolvedValueOnce(page.map(slot => ({ signature: `sig-${slot}`, slot })));
    }
    const getSignaturesForAddress = vi.fn(() => ({ send }));

    return { getSignaturesForAddress, send } as unknown as Rpc<GetSignaturesForAddressApi> & {
        getSignaturesForAddress: ReturnType<typeof vi.fn>;
        send: typeof send;
    };
}

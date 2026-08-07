import { type Address, type GetSignaturesForAddressApi, type Rpc, type Signature } from '@solana/kit';

/** The largest page `getSignaturesForAddress` serves. */
const SIGNATURE_PAGE_LIMIT = 1_000;

/**
 * How far back the walk will page before giving up. Stake accounts hold few signatures, because
 * epoch rewards are credited by the runtime at the epoch boundary and never appear as transactions.
 * Sampled on mainnet-beta: 25 accounts delegated in epoch 1005 held a median of 8 signatures and at
 * most 139; 25 delegated in epoch 300 — some 700 epochs old — held a median of 270 and at most 615.
 * None reached one page. Five leaves a wide margin over that, at 5 sequential round trips.
 */
const MAX_SIGNATURE_PAGES = 5;

/**
 * Raised when the account cannot be dated: more history than `MAX_SIGNATURE_PAGES` covers, or no
 * signatures at all. The caller must fail the request rather than substitute another epoch. Any
 * substitute is a start *later* than the truth, which yields a total short by an unknown amount —
 * indistinguishable from a correct one, and the failure this whole endpoint is built to avoid.
 */
export class SignatureHistoryUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SignatureHistoryUnavailableError';
    }
}

/**
 * The slot of a stake account's oldest signature, which is the slot it was created in.
 *
 * Pages back until a page arrives short, which is the end of the account's history. Paging is
 * cheap next to the sweep it bounds: one call removes every epoch between the cluster's first
 * reward epoch and the account's own first.
 */
export async function getOldestSignatureSlot({
    abortSignal,
    address,
    rpc,
}: {
    abortSignal?: AbortSignal;
    address: Address;
    rpc: Rpc<GetSignaturesForAddressApi>;
}): Promise<bigint> {
    let before: Signature | undefined;
    let oldestSlot: bigint | undefined;

    for (let page = 0; page < MAX_SIGNATURE_PAGES; page++) {
        const signatures = await rpc
            .getSignaturesForAddress(address, { before, limit: SIGNATURE_PAGE_LIMIT })
            .send({ abortSignal });

        for (const { slot } of signatures) {
            if (oldestSlot === undefined || slot < oldestSlot) {
                oldestSlot = slot;
            }
        }

        // A short page has nothing older behind it, so the history is complete.
        if (signatures.length < SIGNATURE_PAGE_LIMIT) {
            if (oldestSlot === undefined) {
                throw new SignatureHistoryUnavailableError(`${address} has no signatures to date it by`);
            }
            return oldestSlot;
        }

        // The cursor, unlike the slot above, does rely on the RPC returning signatures newest
        // first: paging back needs the oldest entry of the page just read.
        before = signatures[signatures.length - 1].signature;
    }

    throw new SignatureHistoryUnavailableError(
        `${address} has more than ${MAX_SIGNATURE_PAGES * SIGNATURE_PAGE_LIMIT} signatures`,
    );
}

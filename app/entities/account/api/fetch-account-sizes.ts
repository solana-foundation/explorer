import { getRpc } from '@entities/cluster/@x/account';
import { address } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';

import { toByteCount } from '@/app/shared/lib/bytes';

// `space` reports the full length even when the slice returns nothing, so the response stays flat
// however large the accounts are. The commitment matches every other account read on these pages.
const SIZE_ONLY = {
    commitment: 'confirmed',
    dataSlice: { length: 0, offset: 0 },
    encoding: 'base64',
} as const;

export async function fetchAccountSizes(
    pubkeys: PublicKey[],
    clusterUrl: string,
): Promise<ReadonlyMap<string, number>> {
    const { value: infos } = await getRpc(clusterUrl)
        .getMultipleAccounts(
            pubkeys.map(pubkey => address(pubkey.toBase58())),
            SIZE_ONLY,
        )
        .send();

    const sizes = new Map<string, number>();
    infos.forEach((info, i) => {
        const size = info ? toByteCount(info.space) : undefined;
        if (size !== undefined) {
            sizes.set(pubkeys[i].toBase58(), size);
        }
    });
    return sizes;
}

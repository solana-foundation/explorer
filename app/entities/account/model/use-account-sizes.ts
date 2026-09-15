import { getRpc } from '@entities/cluster/@x/account';
import { address } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import useSWR from 'swr';

import { toByteCount } from '@/app/shared/lib/bytes';

// The caller renders a total, not the bytes. `space` reports the full length even when the slice
// returns nothing, so the response stays flat however large the accounts are. The commitment matches
// every other account read on these pages; at the RPC default an account created moments ago reads as
// missing here while its own viewer still serves it.
const SIZE_ONLY = {
    commitment: 'confirmed',
    dataSlice: { length: 0, offset: 0 },
    encoding: 'base64',
} as const;

const EMPTY_SIZES: ReadonlyMap<string, number> = new Map();

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

export function useAccountSizes(pubkeys: PublicKey[], clusterUrl: string) {
    // eslint-disable-next-line unicorn/no-null -- SWR's sentinel for "skip this fetch"
    const swrKey = pubkeys.length > 0 ? ['account-sizes', pubkeys.map(p => p.toBase58()).join(','), clusterUrl] : null;

    const { data, error, isLoading } = useSWR(swrKey, () => fetchAccountSizes(pubkeys, clusterUrl), {
        // Sizes feed a footer total. Refetching the whole list on every tab focus buys nothing.
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
    });

    return { error, loading: isLoading, sizes: data ?? EMPTY_SIZES };
}

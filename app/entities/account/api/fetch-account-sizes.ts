import { getRpc } from '@entities/cluster/@x/account';
import { address } from '@solana/kit';

import { toSafeUint } from '@/app/shared/lib/bigint-to-number';

const SIZE_ONLY = {
    commitment: 'confirmed',
    dataSlice: { length: 0, offset: 0 },
    encoding: 'base64',
} as const;

export async function fetchAccountSizes(
    addresses: readonly string[],
    clusterUrl: string,
): Promise<ReadonlyMap<string, number>> {
    const { value: infos } = await getRpc(clusterUrl)
        .getMultipleAccounts(
            addresses.map(candidate => address(candidate)),
            SIZE_ONLY,
        )
        .send();

    const sizes = new Map<string, number>();
    infos.forEach((info, i) => {
        const size = info === null ? 0 : toSafeUint(info.space);
        if (size !== undefined) {
            sizes.set(addresses[i], size);
        }
    });
    return sizes;
}

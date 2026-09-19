import { getRpc } from '@entities/cluster/@x/account';
import { address } from '@solana/kit';

import { fromBase64 } from '@/app/shared/lib/bytes';

export async function fetchRawAccountData(clusterUrl: string, accountAddress: string): Promise<Uint8Array | undefined> {
    const { value } = await getRpc(clusterUrl)
        .getAccountInfo(address(accountAddress), { commitment: 'confirmed', encoding: 'base64' })
        .send();
    return value ? fromBase64(value.data[0]) : undefined;
}

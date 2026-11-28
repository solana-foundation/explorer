import { type Address } from '@solana/kit';

import { STONK_PARENT_NAME_ACCOUNT } from './constants';
import { getHashedName, getNameAccountKey } from './sns-name-service';

// "stonk•names" (stonknames.shop) — a self-owned root under the same canonical SPL Name Service
// program .sol and .sns use, registered independently rather than through SNS or ANS. Mirrors
// sns-name-service.ts exactly (same program, same hash/PDA derivation); only the TLD and parent
// account differ, so the hashing/decoding helpers are reused from there rather than duplicated.

const STONK_TLD = '.stonk';

export function formatStonkName(label: string): string {
    return label + STONK_TLD;
}

export function parseStonkLabel(domain: string): string | undefined {
    return domain.endsWith(STONK_TLD) ? domain.slice(0, -STONK_TLD.length) : undefined;
}

export function getStonkNameAccount(label: string): Promise<Address> {
    return getNameAccountKey(getHashedName(label), { nameParent: STONK_PARENT_NAME_ACCOUNT });
}

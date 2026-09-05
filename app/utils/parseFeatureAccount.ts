import { Account } from '@providers/accounts';
import { getU64Decoder } from '@solana/kit';

import { readU8 } from '@/app/shared/lib/bytes';

export const FEATURE_PROGRAM_ID = 'Feature111111111111111111111111111111111111';

/** Tag byte marking a feature account whose activation slot follows as a u64. */
const ACTIVATED_TAG = 1;

type FeatureAccount = {
    address: string;
    activatedAt: number | null;
};

function isFeatureAccount(account: Account): boolean {
    return account.owner.toBase58() === FEATURE_PROGRAM_ID && account.data.raw != null;
}

export const useFeatureAccount = (account: Account) => {
    const isFeature = isFeatureAccount(account);

    // allow to retrieve sign of a Feature Account
    return { isFeature };
};

export const parseFeatureAccount = (account: Account): FeatureAccount => {
    if (!isFeatureAccount(account) || account.data.raw == null) {
        throw new Error(`Failed to parse ${account} as a feature account`);
    }
    const raw = account.data.raw;
    const isActivated = readU8(raw, 0) === ACTIVATED_TAG;
    return {
        activatedAt: isActivated ? Number(getU64Decoder().decode(raw, 1)) : null,
        address: account.pubkey.toBase58(),
    };
};

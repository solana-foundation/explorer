import { type Account, isTokenProgramData } from '@providers/accounts';
import { MintAccountInfo, TokenAccountInfo } from '@validators/accounts/token';
import { create } from 'superstruct';

// Extract typed fields from a parsed Account for use with useAccountQuery's `select` option.

export function selectTokenAccountMint(account: Account): string | undefined {
    const parsedData = account.data.parsed;
    if (!parsedData || !isTokenProgramData(parsedData) || parsedData.parsed.type !== 'account') {
        return undefined;
    }
    try {
        const info = create(parsedData.parsed.info, TokenAccountInfo);
        return info.mint.toBase58();
    } catch {
        return undefined;
    }
}

export function selectMintDecimals(account: Account): number | undefined {
    const parsedData = account.data.parsed;
    if (!parsedData || !isTokenProgramData(parsedData) || parsedData.parsed.type !== 'mint') {
        return undefined;
    }
    try {
        const info = create(parsedData.parsed.info, MintAccountInfo);
        return info.decimals;
    } catch {
        return undefined;
    }
}

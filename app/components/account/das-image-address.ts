import { TokenProgramData } from '@providers/accounts';

import { type FullTokenInfo, isRedactedTokenAddress } from '@/app/utils/token-info';

/**
 * Returns the mint address to pass to `useDasImage`, or `undefined` to skip the DAS fetch.
 * Skip when a definitive image is already available. Token-2022 is excluded: its image comes
 * from an async metadata URI fetch, so DAS still serves as a useful fallback.
 */
export function dasImageAddress(
    address: string,
    tokenInfo: FullTokenInfo | undefined,
    parsedData: TokenProgramData | undefined,
): string | undefined {
    const hasDefinitiveImage = Boolean(
        tokenInfo?.logoURI || isRedactedTokenAddress(address) || parsedData?.nftData?.json?.image,
    );
    return hasDefinitiveImage ? undefined : address;
}

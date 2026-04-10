import { unwrapOptionRecursively } from '@metaplex-foundation/umi';

import { isTokenProgramData, type ParsedData } from '@/app/providers/accounts';

export function extractMetaplexMetadata(parsedData: ParsedData): object | undefined {
    if (!isTokenProgramData(parsedData)) return undefined;

    if (parsedData.nftData?.metadata) {
        return unwrapOptionRecursively(parsedData.nftData.metadata);
    }

    return undefined;
}

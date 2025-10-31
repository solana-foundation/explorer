import { isTokenProgramData, type NFTData, type ParsedData } from '@/app/providers/accounts';

export function extractMetaplexMetadata(parsedData: ParsedData): NFTData['metadata'] | undefined {
    if (!isTokenProgramData(parsedData)) return undefined;

    if (parsedData.nftData?.metadata) {
        return parsedData.nftData.metadata;
    }

    return undefined;
}

import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { isSome } from '@metaplex-foundation/umi';
import { MintAccountInfo } from '@validators/accounts/token';

import { isTokenProgramData, ParsedData, TokenProgramData } from '@/app/providers/accounts';

const NFT_TOKEN_STANDARDS = [
    TokenStandard.NonFungible,
    TokenStandard.NonFungibleEdition,
    TokenStandard.ProgrammableNonFungible,
];

export default function isMetaplexNFT(
    parsedData?: ParsedData,
    mintInfo?: MintAccountInfo,
): parsedData is TokenProgramData {
    let tokenStandard: TokenStandard | null = null;
    if (
        parsedData &&
        isTokenProgramData(parsedData) &&
        parsedData.nftData &&
        isSome(parsedData.nftData.metadata.tokenStandard)
    ) {
        tokenStandard = parsedData.nftData.metadata.tokenStandard.value;
    }
    return !!(
        parsedData &&
        isTokenProgramData(parsedData) &&
        parsedData.parsed.type === 'mint' &&
        parsedData.nftData &&
        mintInfo?.decimals === 0 &&
        (parseInt(mintInfo.supply) === 1 || (tokenStandard != null && NFT_TOKEN_STANDARDS.includes(tokenStandard)))
    );
}

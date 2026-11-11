import { boolean, nullable, number, optional, string, type } from 'superstruct';

export const JUPITER_TOKENS_SEARCH_URL = 'https://api.jup.ag/tokens/v2/search';

export const JupiterTokenStruct = type({
    decimals: optional(number()),
    icon: optional(nullable(string())),
    id: string(),
    isVerified: optional(boolean()),
    name: string(),
    symbol: string(),
});

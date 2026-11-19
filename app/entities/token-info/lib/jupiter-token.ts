import { boolean, type Infer, nullable, number, optional, string, type } from 'superstruct';

export const JUPITER_TOKENS_SEARCH_URL = 'https://api.jup.ag/tokens/v2/search';

export const JUPITER_VERIFIED_TOKENS_URL = 'https://api.jup.ag/tokens/v2/tag?query=verified';

export const JupiterTokenStruct = type({
    decimals: optional(number()),
    icon: optional(nullable(string())),
    id: string(),
    isVerified: optional(nullable(boolean())),
    name: string(),
    symbol: string(),
    website: optional(nullable(string())),
});

export type JupiterToken = Infer<typeof JupiterTokenStruct>;

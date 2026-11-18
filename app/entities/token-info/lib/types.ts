import { boolean, type Infer, number, optional, string, type } from 'superstruct';

export const TokenInfoStruct = type({
    address: string(),
    decimals: optional(number()),
    logoURI: optional(string()),
    name: optional(string()),
    symbol: optional(string()),
    verified: boolean(),
});

export type TokenInfo = Infer<typeof TokenInfoStruct>;

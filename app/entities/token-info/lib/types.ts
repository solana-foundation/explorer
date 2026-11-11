import { boolean, type Infer, nullable, number, string, type } from 'superstruct';

export const TokenInfoStruct = type({
    address: string(),
    decimals: nullable(number()),
    logoURI: nullable(string()),
    name: string(),
    symbol: string(),
    verified: boolean(),
});

export type TokenInfo = Infer<typeof TokenInfoStruct>;

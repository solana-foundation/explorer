import { boolean, type Infer, nullable, number, string, type } from 'superstruct';

export const TokenInfoStruct = type({
    address: string(),
    decimals: nullable(number()),
    logoURI: nullable(string()),
    name: nullable(string()),
    symbol: nullable(string()),
    verified: boolean(),
});

export type TokenInfo = Infer<typeof TokenInfoStruct>;

export type TokenInfoResult = {
    isLoading: boolean;
    tokenInfo: TokenInfo | undefined;
};

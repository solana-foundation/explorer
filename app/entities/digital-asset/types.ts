import { array, boolean, Infer, number, optional, string, type } from 'superstruct';

export const DigitalAssetSchema = type({
    burnt: boolean(),
    content: type({
        $schema: string(),
        files: optional(
            array(
                type({
                    cdn_uri: optional(string()),
                    mime: optional(string()),
                    uri: optional(string()),
                }),
            ),
        ),
        json_uri: string(),
        links: optional(
            type({
                external_url: optional(string()),
                image: optional(string()),
            }),
        ),
        metadata: type({
            description: optional(string()),
            name: optional(string()),
            symbol: optional(string()),
            token_standard: optional(string()),
        }),
    }),
    id: string(),
    interface: string(),
    mutable: boolean(),
    token_info: optional(
        type({
            decimals: optional(number()),
            mint_authority: optional(string()),
            price_info: optional(
                type({
                    currency: optional(string()),
                    price_per_token: optional(number()),
                }),
            ),
            supply: optional(number()),
            symbol: optional(string()),
            token_program: optional(string()),
        }),
    ),
});

export const GetAssetBatchResponseSchema = type({
    result: array(DigitalAssetSchema),
});

export type DigitalAsset = Infer<typeof DigitalAssetSchema>;

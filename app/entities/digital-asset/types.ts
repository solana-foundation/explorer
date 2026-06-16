import { array, Infer, optional, string, type } from 'superstruct';

export const DigitalAssetSchema = type({
    content: type({
        links: optional(
            type({
                external_url: optional(string()),
                image: optional(string()),
            }),
        ),
    }),
    id: string(),
});

export const GetAssetBatchResponseSchema = type({
    result: array(DigitalAssetSchema),
});

export type DigitalAsset = Infer<typeof DigitalAssetSchema>;

import { array, Infer, nullable, optional, string, type } from 'superstruct';

export const DigitalAssetSchema = type({
    content: nullable(
        type({
            links: nullable(
                optional(
                    type({
                        image: nullable(optional(string())),
                    }),
                ),
            ),
        }),
    ),
    id: string(),
});

export const GetAssetBatchResponseSchema = type({
    result: array(nullable(DigitalAssetSchema)),
});

export type DigitalAsset = Infer<typeof DigitalAssetSchema>;

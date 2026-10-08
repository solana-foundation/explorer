import { is, nullable, optional, string, type } from 'superstruct';

type NftokenMetadata = {
    image: string | undefined;
    name: string | undefined;
};

export type NftokenMetadataAnswer = { kind: 'loaded'; metadata: NftokenMetadata } | { kind: 'unavailable' };

const NftokenMetadataSchema = type({
    image: optional(nullable(string())),
    name: optional(nullable(string())),
});

export function parseNftokenMetadata(json: unknown): NftokenMetadataAnswer {
    if (Array.isArray(json) || !is(json, NftokenMetadataSchema)) return { kind: 'unavailable' };

    return {
        kind: 'loaded',
        metadata: {
            image: json.image?.trim() || undefined,
            name: json.name?.trim() || undefined,
        },
    };
}

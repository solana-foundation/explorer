import type { DigitalAsset } from '@/app/entities/digital-asset/types';

export function makeDasAsset(id: string, image: string | null = null): DigitalAsset {
    return {
        content: { links: { image } },
        id,
    };
}

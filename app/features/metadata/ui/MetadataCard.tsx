import { useMemo } from 'react';

import type { Account } from '@/app/providers/accounts';

import { extractMetaplexMetadata } from '../lib/metaplexMetadata';
import { extractTokenMetadata } from '../lib/tokenMetadata';
import { useOffChainMetadata } from '../model/useOffChainMetadata';
import { BaseMetadataCard, type MetadataSection } from './BaseMetadataCard';

export function MetadataCard({ account }: { account: Account }) {
    const couldHaveOnChainData = Boolean(account.data.parsed);

    if (couldHaveOnChainData) {
        return <OnChainMetadataCard account={account} />;
    }
    return <OffChainMetadataCard account={account} />;
}

function OnChainMetadataCard({ account }: { account: Account }) {
    const sections = useMemo<MetadataSection[]>(() => {
        const parsedData = account.data.parsed;

        const availableSections: MetadataSection[] = [];

        if (!parsedData) return availableSections;

        const tokenMetadata = extractTokenMetadata(parsedData);
        const metaplexMetadata = extractMetaplexMetadata(parsedData);

        if (tokenMetadata) {
            availableSections.push({
                data: tokenMetadata,
                id: 'token-metadata',
                title: 'Token extension',
            });
        }

        if (metaplexMetadata) {
            availableSections.push({
                data: metaplexMetadata,
                id: 'metaplex-metadata',
                title: 'Metaplex',
            });
        }

        return availableSections;
    }, [account]);

    return <BaseMetadataCard sections={sections} />;
}

function OffChainMetadataCard({ account }: { account: Account }) {
    const { metadata } = useOffChainMetadata(account.pubkey);

    const sections = (() => {
        const availableSections: MetadataSection[] = [];

        if (!metadata) return availableSections;

        availableSections.push({
            data: metadata,
            id: 'compressed-nft-metadata',
            title: 'Compressed NFT Metadata',
        });

        return availableSections;
    })();

    return <BaseMetadataCard sections={sections} />;
}

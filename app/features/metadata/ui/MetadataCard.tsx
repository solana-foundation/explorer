import { useMemo } from 'react';

import { ErrorCard } from '@/app/components/common/ErrorCard';
import { SolarizedJsonViewer as ReactJson } from '@/app/components/common/JsonViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/shared/ui/tabs';
import type { Account } from '@/app/providers/accounts';

import { extractMetaplexMetadata } from '../lib/metaplexMetadata';
import { extractTokenMetadata } from '../lib/tokenMetadata';
import { useOffChainMetadata } from '../model/useOffChainMetadata';

interface MetadataTab {
    id: string;
    title: string;
    data: object;
}

export function MetadataCard({ account }: { account: Account }) {
    const couldHaveOnChainData = Boolean(account.data.parsed);

    if (couldHaveOnChainData) {
        return <OnChainMetadataCard account={account} />;
    }
    return <OffChainMetadataCard account={account} />;
}

function OnChainMetadataCard({ account }: { account: Account }) {
    const tabs = useMemo<MetadataTab[]>(() => {
        const parsedData = account.data.parsed;

        const availableTabs: MetadataTab[] = [];

        if (!parsedData) return availableTabs;

        const tokenMetadata = extractTokenMetadata(parsedData);
        const metaplexMetadata = extractMetaplexMetadata(parsedData);

        if (tokenMetadata) {
            availableTabs.push({
                data: tokenMetadata,
                id: 'token-metadata',
                title: 'Token extension',
            });
        }

        if (metaplexMetadata) {
            availableTabs.push({
                data: metaplexMetadata,
                id: 'metaplex-metadata',
                title: 'Metaplex',
            });
        }

        return availableTabs;
    }, [account]);

    return <BaseCard tabs={tabs} />;
}

function OffChainMetadataCard({ account }: { account: Account }) {
    const { metadata } = useOffChainMetadata(account.pubkey);

    const tabs = (() => {
        const availableTabs: MetadataTab[] = [];

        if (!metadata) return availableTabs;

        availableTabs.push({
            data: metadata,
            id: 'compressed-nft-metadata',
            title: 'Compressed NFT Metadata',
        });

        return availableTabs;
    })();

    return <BaseCard tabs={tabs} />;
}

function BaseCard({ tabs }: { tabs: MetadataTab[] }) {
    if (tabs.length === 0) {
        return <ErrorCard text="No metadata found" />;
    }

    return (
        <div className="card">
            <div className="card-body">
                <Tabs defaultValue={tabs[0]?.id}>
                    <TabsList>
                        {tabs.map(tab => (
                            <TabsTrigger key={tab.id} value={tab.id}>
                                {tab.title}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {tabs.map(tab => (
                        <TabsContent key={tab.id} value={tab.id}>
                            <div className="metadata-json-viewer e-mt-5">
                                <ReactJson
                                    src={tab.data}
                                    style={{ padding: 25 }}
                                    name={false}
                                    enableClipboard={true}
                                    displayObjectSize={false}
                                    displayDataTypes={false}
                                />
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    );
}

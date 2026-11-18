'use client';

import { AccountHeader } from '@components/common/Account';
import { useAccountFetching, useRefreshAccount } from '@entities/account';
import { fetchTokenInfoFromApi, getTokenInfoSwrKey } from '@entities/token-info';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import useSWR from 'swr';

import { Card, CardBody } from '@/app/shared/ui/Card';
import { populatePartialParsedTokenExtension } from '@/app/utils/token-extension';
import { TokenExtension } from '@/app/validators/accounts/token-extension';

import { LoadingCard } from '../common/LoadingCard';
import { TokenExtensionsSection } from './TokenExtensionsSection';
import { ParsedTokenExtension } from './types';

async function fetchTokenInfo([_, address, cluster, genesisHash]: ReturnType<typeof getTokenInfoSwrKey>) {
    return await fetchTokenInfoFromApi(new PublicKey(address), cluster, genesisHash);
}

export function TokenExtensionsCard({
    decimals,
    address,
    extensions: mintExtensions,
}: {
    decimals: number;
    address: string;
    extensions: TokenExtension[];
}) {
    const { cluster, genesisHash } = useCluster();
    const refresh = useRefreshAccount();
    const fetching = useAccountFetching(address);
    const swrKey = useMemo(() => getTokenInfoSwrKey(address, cluster, genesisHash), [address, cluster, genesisHash]);
    const { data: tokenInfo, isLoading } = useSWR(swrKey, fetchTokenInfo);

    const extensions = populateTokenExtensions(mintExtensions);

    // check for nullish decimals to satisfy constraint for required decimals.
    if (isLoading) {
        return <LoadingCard />;
    } else if (tokenInfo && tokenInfo.decimals !== null && decimals !== tokenInfo.decimals) {
        throw new Error('Can not fetch token info.');
    }

    const symbol =
        mintExtensions.find(({ extension }) => extension === 'tokenMetadata')?.state.symbol || tokenInfo?.symbol;

    return (
        <Card ui="dashkit">
            <AccountHeader
                title="Extensions"
                analyticsSection="extensions_section"
                refresh={() => refresh(new PublicKey(address), 'parsed')}
                fetching={fetching}
            />
            <CardBody ui="dashkit" className="overflow-x-scroll !p-0">
                <TokenExtensionsSection
                    address={address}
                    decimals={decimals}
                    extensions={mintExtensions}
                    parsedExtensions={extensions}
                    symbol={symbol}
                />
            </CardBody>
        </Card>
    );
}

function populateTokenExtensions(extensions: TokenExtension[]): ParsedTokenExtension[] {
    const result = extensions.reduce((acc, { extension, state }) => {
        const data = populatePartialParsedTokenExtension(extension);
        acc.set(extension, {
            ...data,
            extension: extension,
            parsed: state,
        });

        return acc;
    }, new Map<string, ParsedTokenExtension>());

    return Array.from(result.values());
}

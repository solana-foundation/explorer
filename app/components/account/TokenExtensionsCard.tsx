'use client';

import { AccountHeader } from '@components/common/Account';
import { useFetchAccountInfo } from '@providers/accounts';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { useMemo } from 'react';
import useSWR from 'swr';

import { populatePartialParsedTokenExtension } from '@/app/utils/token-extension';
import { getTokenInfo, getTokenInfoSwrKey } from '@/app/utils/token-info';
import { TokenExtension } from '@/app/validators/accounts/token-extension';

import { LoadingCard } from '../common/LoadingCard';
import { TokenExtensionsSection } from './TokenExtensionsSection';
import { ParsedTokenExtension } from './types';

async function fetchTokenInfo([_, address, cluster, url]: ['get-token-info', string, Cluster, string]) {
    return await getTokenInfo(new PublicKey(address), cluster, url);
}

export function TokenExtensionsCard({
    address,
    extensions: mintExtensions,
}: {
    address: string;
    extensions: TokenExtension[];
}) {
    const { cluster, url } = useCluster();
    const refresh = useFetchAccountInfo();
    const swrKey = useMemo(() => getTokenInfoSwrKey(address, cluster, url), [address, cluster, url]);
    const { data: tokenInfo, isLoading } = useSWR(swrKey, fetchTokenInfo);

    const extensions = populateTokenExtensions(mintExtensions);

    // check for nullish decimals to satisty constraint for required decimals.
    if (isLoading) {
        return <LoadingCard />;
    } else if (!tokenInfo || tokenInfo.decimals === null) {
        throw new Error('Can not fetch token info.');
    }

    return (
        <div className="card">
            <AccountHeader title="Extensions" refresh={() => refresh(new PublicKey(address), 'parsed')} />
            <div className="card-body p-0 e-overflow-x-scroll">
                <TokenExtensionsSection
                    address={address}
                    decimals={tokenInfo.decimals}
                    extensions={mintExtensions}
                    parsedExtensions={extensions}
                    symbol={tokenInfo.symbol}
                />
            </div>
        </div>
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

'use client';

import { useCluster } from '@providers/cluster';
import { Button } from '@shared/ui/button';
import { createSolanaRpc, signature as createSignature } from '@solana/kit';
import { Cluster, clusterName, clusterSlug, clusterUrl } from '@utils/cluster';
import { useClusterPath } from '@utils/url';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { Card, CardBody } from '@/app/shared/ui/Card';

export function TransactionNotFoundCard({
    signature,
    retry,
    firstAvailableBlock,
}: {
    signature: string;
    retry?: () => void;
    firstAvailableBlock?: bigint;
}) {
    const { cluster } = useCluster();
    const { status, searchingCluster, foundCluster } = useClusterTransactionSearch(signature, cluster);

    let subtext: React.ReactNode = undefined;
    if (status === 'searching' && searchingCluster !== undefined) {
        subtext = (
            <span>
                <span className="e-align-middle">Transaction does not exist</span>
                <br />
                <SearchingClusterIndicator searchingCluster={searchingCluster} />
            </span>
        );
    } else if (status === 'found' && foundCluster !== undefined) {
        subtext = (
            <span>
                <span className="e-align-middle">Transaction does not exist</span>
                <br />
                <AdjacentTransactionLink signature={signature} foundCluster={foundCluster} />
            </span>
        );
    } else if (status === 'not-found' && firstAvailableBlock !== undefined && firstAvailableBlock > 0n) {
        subtext = `Note: Transactions processed before block ${firstAvailableBlock} are not available at this time`;
    }

    const buttonText = 'Try Again';

    return (
        <Card ui="dashkit">
            <CardBody ui="dashkit" className="e-text-center">
                Not Found
                {retry && (
                    <>
                        <Button
                            ui="dashkit"
                            variant="white"
                            className="e-ml-3 e-hidden md:e-inline"
                            onClick={retry}
                            asChild
                        >
                            <span>{buttonText}</span>
                        </Button>
                        <div className="e-mt-6 e-block md:e-hidden">
                            <Button ui="dashkit" variant="white" className="e-w-full" onClick={retry} asChild>
                                <span>{buttonText}</span>
                            </Button>
                        </div>
                    </>
                )}
                {subtext && (
                    <div className="e-text-dk-gray-700">
                        <hr />
                        {subtext}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}

type SearchStatus = 'idle' | 'searching' | 'found' | 'not-found';

function useClusterTransactionSearch(signature: string, currentCluster: Cluster) {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<SearchStatus>('idle');
    const [searchingCluster, setSearchingCluster] = useState<Cluster | undefined>(undefined);
    const [foundCluster, setFoundCluster] = useState<Cluster | undefined>(undefined);
    const searchIdRef = useRef(0);

    const sleep = () => new Promise(res => setTimeout(res, 700));

    const customUrl = searchParams?.get('customUrl');

    useEffect(() => {
        const currentSearchId = ++searchIdRef.current;

        const clusters = [Cluster.MainnetBeta, Cluster.Devnet, Cluster.Testnet].filter(c => c !== currentCluster);
        const hasCustomUrlEnabled = Boolean(customUrl);

        if (hasCustomUrlEnabled) {
            clusters.push(Cluster.Custom);
        }

        const searchClusters = async () => {
            if (searchIdRef.current !== currentSearchId) return;

            setStatus('searching');

            for (const cluster of clusters) {
                if (searchIdRef.current !== currentSearchId) return;

                setSearchingCluster(cluster);

                try {
                    let url = clusterUrl(cluster, '');

                    if (customUrl && cluster === Cluster.Custom) {
                        url = customUrl;
                    }

                    const rpc = createSolanaRpc(url);
                    const statusRes = await rpc
                        .getSignatureStatuses([createSignature(signature)], { searchTransactionHistory: true })
                        .send();

                    if (searchIdRef.current !== currentSearchId) return;

                    // RPC returns literal null for missing signatures per JSON-RPC spec
                    if (statusRes.value[0] !== null) {
                        setFoundCluster(cluster);
                        setStatus('found');
                        return;
                    } else {
                        await sleep();
                    }
                } catch (_error) {
                    if (searchIdRef.current !== currentSearchId) return;
                }
            }

            if (searchIdRef.current === currentSearchId) {
                setStatus('not-found');
                setSearchingCluster(undefined);
            }
        };

        searchClusters();

        return () => {
            if (searchIdRef.current === currentSearchId) {
                searchIdRef.current += 1;
            }
        };
    }, [signature, currentCluster, customUrl]);

    return { foundCluster, searchingCluster, status };
}

function AdjacentTransactionLink({ signature, foundCluster }: { signature: string; foundCluster: Cluster }) {
    const moniker = clusterSlug(foundCluster);
    const foundClusterPath = useClusterPath({
        additionalParams: new URLSearchParams(`cluster=${moniker}`),
        pathname: `/tx/${signature}`,
    });

    return (
        <a href={foundClusterPath} className="e-align-middle e-text-dk-info" style={{ marginRight: '5px' }}>
            Found on {clusterName(foundCluster)}
        </a>
    );
}

function SearchingClusterIndicator({ searchingCluster }: { searchingCluster: Cluster }) {
    const spinnerCls = 'spinner-grow spinner-grow-sm';

    return (
        <>
            <span
                style={{ height: '10px', marginRight: '5px', width: '10px' }}
                className={`${spinnerCls} e-inline-block e-align-middle`}
            />
            <span
                className="e-align-middle e-text-dk-gray-700"
                style={{ marginRight: '10px', verticalAlign: 'middle' }}
            >
                checking {clusterName(searchingCluster).toLowerCase()}
            </span>
        </>
    );
}

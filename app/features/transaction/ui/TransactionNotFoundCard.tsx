'use client';

import { useCluster } from '@providers/cluster';
import { Cluster, clusterName, clusterSlug } from '@utils/cluster';
import { useClusterPath } from '@utils/url';
import React from 'react';

import { useClusterTransactionSearch } from '../model/use-cluster-transaction-search';
import { BaseTransactionNotFoundCard } from './BaseTransactionNotFoundCard';

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
                <span className="align-middle">Transaction does not exist</span>
                <br />
                <SearchingClusterIndicator searchingCluster={searchingCluster} />
            </span>
        );
    } else if (status === 'found' && foundCluster !== undefined) {
        subtext = (
            <span>
                <span className="align-middle">Transaction does not exist</span>
                <br />
                <AdjacentTransactionLink signature={signature} foundCluster={foundCluster} />
            </span>
        );
    } else if (status === 'not-found' && firstAvailableBlock !== undefined && firstAvailableBlock > 0n) {
        subtext = `Note: Transactions processed before block ${firstAvailableBlock} are not available at this time`;
    }

    return <BaseTransactionNotFoundCard retry={retry} subtext={subtext} />;
}

function AdjacentTransactionLink({ signature, foundCluster }: { signature: string; foundCluster: Cluster }) {
    const moniker = clusterSlug(foundCluster);
    const foundClusterPath = useClusterPath({
        additionalParams: new URLSearchParams(`cluster=${moniker}`),
        pathname: `/tx/${signature}`,
    });

    return (
        <a href={foundClusterPath} className="align-middle text-dk-info" style={{ marginRight: '5px' }}>
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
                className={`${spinnerCls} inline-block align-middle`}
            />
            <span className="align-middle text-dk-gray-700" style={{ marginRight: '10px', verticalAlign: 'middle' }}>
                checking {clusterName(searchingCluster).toLowerCase()}
            </span>
        </>
    );
}

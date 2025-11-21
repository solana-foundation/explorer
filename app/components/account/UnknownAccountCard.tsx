'use client';

import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { TableCardBody } from '@components/common/TableCardBody';
import { Account } from '@providers/accounts';
import { useCluster } from '@providers/cluster';
import { address as createAddress, createSolanaRpc } from '@solana/kit';
import { Cluster, clusterName, clusterSlug, clusterUrl } from '@utils/cluster';
import { addressLabel } from '@utils/tx';
import { useClusterPath } from '@utils/url';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function UnknownAccountCard({ account }: { account: Account }) {
    const { cluster } = useCluster();

    const label = addressLabel(account.pubkey.toBase58(), cluster);
    return (
        <div className="card">
            <div className="card-header align-items-center">
                <h3 className="card-header-title">Overview</h3>
            </div>

            <TableCardBody>
                <tr>
                    <td>Address</td>
                    <td className="text-lg-end">
                        <Address pubkey={account.pubkey} alignRight raw />
                    </td>
                </tr>
                {label && (
                    <tr>
                        <td>Address Label</td>
                        <td className="text-lg-end">{label}</td>
                    </tr>
                )}
                <tr>
                    <td>Balance (SOL)</td>
                    <td className="text-lg-end">
                        {account.lamports === 0 ? (
                            <AccountNofFound account={account} />
                        ) : (
                            <SolBalance lamports={account.lamports} />
                        )}
                    </td>
                </tr>

                {account.space !== undefined && (
                    <tr>
                        <td>Allocated Data Size</td>
                        <td className="text-lg-end">{account.space} byte(s)</td>
                    </tr>
                )}

                <tr>
                    <td>Assigned Program Id</td>
                    <td className="text-lg-end">
                        <Address pubkey={account.owner} alignRight link />
                    </td>
                </tr>

                <tr>
                    <td>Executable</td>
                    <td className="text-lg-end">{account.executable ? 'Yes' : 'No'}</td>
                </tr>
            </TableCardBody>
        </div>
    );
}

type SearchStatus = 'idle' | 'searching' | 'found' | 'not-found';

function useClusterAccountSearch(address: string, currentCluster: Cluster, _enableCustomClsuter?: boolean) {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<SearchStatus>('idle');
    const [searchingCluster, setSearchingCluster] = useState<Cluster | null>(null);
    const [foundCluster, setFoundCluster] = useState<Cluster | null>(null);
    const searchIdRef = useRef(0);

    const sleep = () => new Promise(res => setTimeout(res, 700));

    // Extract the customUrl value to avoid re-running effect on searchParams object change
    const customUrl = searchParams?.get('customUrl');

    useEffect(() => {
        // Increment search ID to track this specific search
        const currentSearchId = ++searchIdRef.current;

        // NOTE: This ref-based approach prevents duplicate requests within a single component instance,
        // but if multiple instances of UnknownAccountCard are rendered (e.g., as both a Suspense fallback
        // and returned from CompressedNftCard), each instance will still make its own RPC requests.
        // Consider moving the search logic to a parent component or using React Context to share state
        // between instances if duplicate requests become a performance issue.

        const clusters = [Cluster.MainnetBeta, Cluster.Devnet, Cluster.Testnet].filter(c => c !== currentCluster);

        const hasCustomUrlEnabled = Boolean(customUrl);

        // add custom url if parameter is present
        if (hasCustomUrlEnabled) {
            clusters.push(Cluster.Custom);
        }

        const searchClusters = async () => {
            // Check if this search is still the current one
            if (searchIdRef.current !== currentSearchId) return;

            setStatus('searching');

            // search cluster one by one to not make extra requests
            for (const cluster of clusters) {
                // Check if this search has been superseded
                if (searchIdRef.current !== currentSearchId) return;

                setSearchingCluster(cluster);

                try {
                    let url = clusterUrl(cluster, '');

                    // adjust url for a custom cluster as `clusterUrl` does not return one
                    if (customUrl && cluster === Cluster.Custom) {
                        url = customUrl;
                    }

                    const rpc = createSolanaRpc(url);
                    const accountInfo = await rpc.getAccountInfo(createAddress(address), { encoding: 'base64' }).send();

                    // Check again before updating state
                    if (searchIdRef.current !== currentSearchId) return;

                    if (accountInfo.value !== null) {
                        setFoundCluster(cluster);
                        setStatus('found');
                        return;
                    } else {
                        // not only prevent span but allow component to react properly without making the structure complex
                        await sleep();
                    }
                } catch (error) {
                    // Check if this search is still active before continuing
                    if (searchIdRef.current !== currentSearchId) return;
                    // Continue to next cluster
                }
            }

            // Final check before updating not-found status
            if (searchIdRef.current === currentSearchId) {
                setStatus('not-found');
                setSearchingCluster(null);
            }
        };

        searchClusters();

        // Cleanup function to mark this search as cancelled
        return () => {
            if (searchIdRef.current === currentSearchId) {
                searchIdRef.current += 1;
            }
        };
    }, [address, currentCluster, customUrl]);

    return { foundCluster, searchingCluster, status };
}

const LABELS = {
    'not-found': 'Account does not exist',
};

function AccountNofFound({ account, labels = LABELS }: { account: Account; labels?: typeof LABELS }) {
    const { cluster } = useCluster();
    const address = account.pubkey.toBase58();
    const { status, searchingCluster, foundCluster } = useClusterAccountSearch(address, cluster);

    if (status === 'searching' && searchingCluster !== null) {
        return (
            <span>
                <SearchingAddressIndicator searchingCluster={searchingCluster} />
                <span className="align-middle">{labels['not-found']}</span>
            </span>
        );
    }

    const isAddressFoundOnAnotherClsuter = status === 'found' && foundCluster !== null;

    return isAddressFoundOnAnotherClsuter ? (
        <span>
            <AdjacentAddressLink address={address} foundCluster={foundCluster} />
            <span className="align-middle">{labels['not-found']}</span>
        </span>
    ) : (
        <span>{labels['not-found']}</span>
    );
}

function AdjacentAddressLink({ address, foundCluster }: { address: string; foundCluster: Cluster }) {
    const moniker = clusterSlug(foundCluster);
    const foundClusterPath = useClusterPath({
        additionalParams: new URLSearchParams(`cluster=${moniker}`),
        pathname: `/address/${address}`,
    });

    return (
        <a href={foundClusterPath} className="text-info align-middle" style={{ marginRight: '5px' }}>
            Found on {clusterName(foundCluster)}
        </a>
    );
}

function SearchingAddressIndicator({ searchingCluster }: { searchingCluster: Cluster }) {
    const spinnerCls = 'spinner-grow spinner-grow-sm';

    return (
        <>
            <span
                style={{
                    height: '10px',
                    marginRight: '5px',
                    width: '10px',
                }}
                className={`${spinnerCls} align-middle d-inline-block`}
            />
            <span className="text-muted align-middle" style={{ marginRight: '10px', verticalAlign: 'middle' }}>
                checking {clusterName(searchingCluster).toLowerCase()}
            </span>
        </>
    );
}

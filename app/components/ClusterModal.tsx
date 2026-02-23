'use client';

import { useCluster, useClusterModal, useUpdateCustomUrl } from '@providers/cluster';
import { useDebounceCallback } from '@react-hook/debounce';
import { Cluster, clusterName, CLUSTERS, clusterSlug, ClusterStatus } from '@utils/cluster';
import { addSavedCluster, getSavedClusters, removeSavedCluster, SavedCluster, setPersistedCluster } from '@utils/cluster-storage';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

import { Overlay } from './common/Overlay';

const ClusterModalDeveloperSettings = dynamic(() => import('./ClusterModalDeveloperSettings'), { ssr: false });

export function ClusterModal() {
    const [show, setShow] = useClusterModal();
    const onClose = () => setShow(false);

    return (
        <>
            <div className={`offcanvas offcanvas-end${show ? ' show' : ''}`}>
                <div className="modal-body" onClick={e => e.stopPropagation()}>
                    <span className="c-pointer" onClick={onClose}>
                        &times;
                    </span>

                    <h2 className="text-center mb-4 mt-4">Choose a Cluster</h2>
                    <ClusterToggle />
                    <ClusterModalDeveloperSettings />
                </div>
            </div>

            <div onClick={onClose}>
                <Overlay show={show} />
            </div>
        </>
    );
}

type InputProps = { activeSuffix: string; active: boolean; onSaved: () => void };
function CustomClusterInput({ activeSuffix, active, onSaved }: InputProps) {
    const { customUrl } = useCluster();
    const updateCustomUrl = useUpdateCustomUrl();
    const [editing, setEditing] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [clusterName, setClusterName] = React.useState('');
    const [currentUrl, setCurrentUrl] = React.useState(customUrl);
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const btnClass = active ? `border-${activeSuffix} text-${activeSuffix}` : 'btn-white';

    const onUrlInput = useDebounceCallback((url: string) => {
        setCurrentUrl(url);
        updateCustomUrl(url);
        if (url.length > 0) {
            const nextSearchParams = new URLSearchParams(searchParams?.toString());
            nextSearchParams.set('customUrl', url);
            const nextQueryString = nextSearchParams.toString();
            router.push(`${pathname}${nextQueryString ? `?${nextQueryString}` : ''}`);
        }
    }, 500);

    const handleSave = () => {
        if (!clusterName.trim()) return;
        addSavedCluster({ name: clusterName.trim(), url: currentUrl });
        setPersistedCluster(`custom:${clusterName.trim()}`);
        setClusterName('');
        setSaving(false);
        onSaved();
    };

    const inputTextClass = editing ? '' : 'text-muted';
    return (
        <>
            <Link
                className={`btn col-12 mb-3 ${btnClass}`}
                href={{ query: { cluster: 'custom', ...(customUrl.length > 0 ? { customUrl } : null) } }}
            >
                Custom RPC URL
            </Link>
            {active && (
                <>
                    <input
                        type="url"
                        defaultValue={customUrl}
                        className={`form-control ${inputTextClass}`}
                        onFocus={() => setEditing(true)}
                        onBlur={() => setEditing(false)}
                        onInput={e => onUrlInput(e.currentTarget.value)}
                    />
                    {!saving ? (
                        <button
                            className="btn btn-sm btn-white col-12 mt-2 mb-3"
                            onClick={() => setSaving(true)}
                            data-testid="save-custom-cluster-btn"
                        >
                            Save this cluster
                        </button>
                    ) : (
                        <div className="mt-2 mb-3" data-testid="save-cluster-form">
                            <input
                                type="text"
                                className="form-control form-control-sm mb-2"
                                placeholder="Cluster name"
                                value={clusterName}
                                onChange={e => setClusterName(e.target.value)}
                                data-testid="cluster-name-input"
                                autoFocus
                            />
                            {clusterName.trim() === '' && (
                                <small className="text-muted" data-testid="name-required-hint">
                                    Name is required
                                </small>
                            )}
                            <div className="d-flex gap-2 mt-1">
                                <button
                                    className="btn btn-sm btn-primary flex-grow-1"
                                    onClick={handleSave}
                                    disabled={!clusterName.trim()}
                                    data-testid="confirm-save-cluster-btn"
                                >
                                    Save
                                </button>
                                <button
                                    className="btn btn-sm btn-white flex-grow-1"
                                    onClick={() => {
                                        setSaving(false);
                                        setClusterName('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
}

function assertUnreachable(_x: never): never {
    throw new Error('Unreachable!');
}

function SavedClusterItem({
    cluster,
    activeSuffix,
    isActive,
    onDelete,
}: {
    cluster: SavedCluster;
    activeSuffix: string;
    isActive: boolean;
    onDelete: (name: string) => void;
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const btnClass = isActive ? `border-${activeSuffix} text-${activeSuffix}` : 'btn-white';

    const nextSearchParams = new URLSearchParams(searchParams?.toString());
    nextSearchParams.set('cluster', 'custom');
    nextSearchParams.set('customUrl', cluster.url);
    const nextQueryString = nextSearchParams.toString();
    const clusterUrl = `${pathname}?${nextQueryString}`;

    const truncatedUrl = cluster.url.length > 40 ? cluster.url.slice(0, 37) + '...' : cluster.url;

    return (
        <div className="d-flex align-items-center mb-2" data-testid={`saved-cluster-${cluster.name}`}>
            <Link
                className={`btn flex-grow-1 text-start ${btnClass}`}
                href={clusterUrl}
                onClick={() => setPersistedCluster(`custom:${cluster.name}`)}
            >
                <div>{cluster.name}</div>
                <small className="text-muted">{truncatedUrl}</small>
            </Link>
            <button
                className="btn btn-sm btn-white ms-2"
                onClick={e => {
                    e.stopPropagation();
                    onDelete(cluster.name);
                }}
                data-testid={`delete-cluster-${cluster.name}`}
                aria-label={`Delete ${cluster.name}`}
            >
                &times;
            </button>
        </div>
    );
}

function SavedClustersSection({ activeSuffix }: { activeSuffix: string }) {
    const [savedClusters, setSavedClusters] = React.useState<SavedCluster[]>([]);
    const { customUrl, cluster } = useCluster();
    const router = useRouter();
    const pathname = usePathname();

    React.useEffect(() => {
        setSavedClusters(getSavedClusters());
    }, []);

    const refresh = React.useCallback(() => {
        setSavedClusters(getSavedClusters());
    }, []);

    const handleDelete = (name: string) => {
        const isActive = cluster === Cluster.Custom && savedClusters.find(c => c.name === name)?.url === customUrl;
        removeSavedCluster(name);
        if (isActive) {
            setPersistedCluster('mainnet-beta');
            router.push(pathname);
        }
        refresh();
    };

    if (savedClusters.length === 0) return null;

    return (
        <div data-testid="saved-clusters-section">
            <hr />
            <h3 className="text-center mb-3">Saved Clusters</h3>
            {savedClusters.map(sc => (
                <SavedClusterItem
                    key={sc.name}
                    cluster={sc}
                    activeSuffix={activeSuffix}
                    isActive={cluster === Cluster.Custom && customUrl === sc.url}
                    onDelete={handleDelete}
                />
            ))}
        </div>
    );
}

function ClusterToggle() {
    const { status, cluster } = useCluster();
    const [, forceRefresh] = React.useReducer(x => x + 1, 0);

    let activeSuffix = '';
    switch (status) {
        case ClusterStatus.Connected:
            activeSuffix = 'primary';
            break;
        case ClusterStatus.Connecting:
            activeSuffix = 'warning';
            break;
        case ClusterStatus.Failure:
            activeSuffix = 'danger';
            break;
        default:
            assertUnreachable(status);
    }
    const pathname = usePathname();
    const searchParams = useSearchParams();
    return (
        <div className="btn-group-toggle d-flex flex-wrap mb-4">
            {CLUSTERS.map((net, index) => {
                const active = net === cluster;
                if (net === Cluster.Custom)
                    return (
                        <CustomClusterInput
                            key={index}
                            activeSuffix={activeSuffix}
                            active={active}
                            onSaved={forceRefresh}
                        />
                    );

                const btnClass = active ? `border-${activeSuffix} text-${activeSuffix}` : 'btn-white';

                const nextSearchParams = new URLSearchParams(searchParams?.toString());
                const slug = clusterSlug(net);
                if (slug !== 'mainnet-beta') {
                    nextSearchParams.set('cluster', slug);
                } else {
                    nextSearchParams.delete('cluster');
                }
                const nextQueryString = nextSearchParams.toString();
                const clusterUrl = `${pathname}${nextQueryString ? `?${nextQueryString}` : ''}`;
                return (
                    <Link key={index} className={`btn col-12 mb-3 ${btnClass}`} href={clusterUrl}>
                        {clusterName(net)}
                    </Link>
                );
            })}
            <SavedClustersSection activeSuffix={activeSuffix} />
        </div>
    );
}

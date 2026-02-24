'use client';

import { useCluster, useClusterModal, useUpdateCustomUrl } from '@providers/cluster';
import { useDebounceCallback } from '@react-hook/debounce';
import { Cluster, clusterName, CLUSTERS, clusterSlug, ClusterStatus } from '@utils/cluster';
import {
    addSavedCluster,
    getSavedClusters,
    removeSavedCluster,
    SAVED_CLUSTER_PREFIX,
    SavedCluster,
    setPersistedCluster,
} from '@utils/cluster-storage';
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

type InputProps = { activeSuffix: string; active: boolean; onSaved: () => void; savedClusters: SavedCluster[] };
function CustomClusterInput({ activeSuffix, active, onSaved, savedClusters }: InputProps) {
    const { customUrl } = useCluster();
    const updateCustomUrl = useUpdateCustomUrl();
    const [editing, setEditing] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [savedName, setSavedName] = React.useState('');
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const btnClass = active ? `border-${activeSuffix} text-${activeSuffix}` : 'btn-white';

    const onUrlInput = useDebounceCallback((url: string) => {
        updateCustomUrl(url);
        if (url.length > 0) {
            const nextSearchParams = new URLSearchParams(searchParams?.toString());
            nextSearchParams.set('customUrl', url);
            const nextQueryString = nextSearchParams.toString();
            router.push(`${pathname}${nextQueryString ? `?${nextQueryString}` : ''}`);
        }
    }, 500);

    const handleSave = () => {
        if (!savedName.trim()) return;
        addSavedCluster({ name: savedName.trim(), url: customUrl });
        setPersistedCluster(`${SAVED_CLUSTER_PREFIX}${savedName.trim()}`);
        setSavedName('');
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
                        key={customUrl}
                        type="url"
                        defaultValue={customUrl}
                        className={`form-control ${inputTextClass}`}
                        onFocus={() => setEditing(true)}
                        onBlur={() => setEditing(false)}
                        onInput={e => onUrlInput(e.currentTarget.value)}
                    />
                    {saving ? (
                        <div className="col-12 mt-2 mb-3" data-testid="save-cluster-form">
                            <input
                                type="text"
                                className="form-control mb-2"
                                placeholder="Cluster name"
                                value={savedName}
                                onChange={e => setSavedName(e.target.value)}
                                data-testid="cluster-name-input"
                                autoFocus
                            />
                            {savedName.trim() === '' && (
                                <small className="text-muted" data-testid="name-required-hint">
                                    Name is required
                                </small>
                            )}
                            <div className="d-flex gap-2 mt-1">
                                <button
                                    className="btn btn-primary flex-grow-1"
                                    onClick={handleSave}
                                    disabled={!savedName.trim()}
                                    data-testid="confirm-save-cluster-btn"
                                >
                                    Save
                                </button>
                                <button
                                    className="btn btn-white flex-grow-1"
                                    onClick={() => {
                                        setSaving(false);
                                        setSavedName('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : !savedClusters.some(sc => sc.url === customUrl) ? (
                        <button
                            className="btn btn-sm btn-white col-12 mt-2 mb-3"
                            onClick={() => setSaving(true)}
                            data-testid="save-custom-cluster-btn"
                        >
                            Save this cluster
                        </button>
                    ) : null}
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

    return (
        <div className="position-relative col-12 mb-3" data-testid={`saved-cluster-${cluster.name}`}>
            <Link
                className={`btn col-12 text-center ${btnClass}`}
                href={clusterUrl}
                onClick={() => setPersistedCluster(`${SAVED_CLUSTER_PREFIX}${cluster.name}`)}
            >
                {cluster.name}
            </Link>
            <button
                className="btn btn-sm position-absolute"
                style={{ right: 4, top: '50%', transform: 'translateY(-50%)' }}
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

function SavedClustersSection({
    activeSuffix,
    savedClusters,
    onChanged,
}: {
    activeSuffix: string;
    savedClusters: SavedCluster[];
    onChanged: () => void;
}) {
    const { customUrl, cluster } = useCluster();
    const router = useRouter();
    const pathname = usePathname();

    const handleDelete = (name: string) => {
        const isActive = cluster === Cluster.Custom && savedClusters.find(c => c.name === name)?.url === customUrl;
        removeSavedCluster(name);
        if (isActive) {
            setPersistedCluster('mainnet-beta');
            router.push(pathname);
        }
        onChanged();
    };

    if (savedClusters.length === 0) return null;

    return (
        <div className="w-100" data-testid="saved-clusters-section">
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
    const [savedClusters, setSavedClusters] = React.useState<SavedCluster[]>(() => getSavedClusters());
    const refreshSaved = React.useCallback(() => setSavedClusters(getSavedClusters()), []);

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
                            onSaved={refreshSaved}
                            savedClusters={savedClusters}
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
            <SavedClustersSection activeSuffix={activeSuffix} savedClusters={savedClusters} onChanged={refreshSaved} />
        </div>
    );
}

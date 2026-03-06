'use client';

import { addSavedClusterAtom, removeSavedClusterAtom, type SavedCluster, savedClustersAtom } from '@features/custom-cluster';
import { useCluster, useClusterModal, useUpdateCustomUrl } from '@providers/cluster';
import { useDebounceCallback } from '@react-hook/debounce';
import { Cluster, clusterName, CLUSTERS, clusterSlug, ClusterStatus, DEFAULT_CLUSTER } from '@utils/cluster';
import { cva } from 'class-variance-authority';
import { useAtomValue, useSetAtom } from 'jotai';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { Trash2 } from 'react-feather';

import { Overlay } from './common/Overlay';
import { cn } from './shared/utils';

const ClusterModalDeveloperSettings = dynamic(() => import('./ClusterModalDeveloperSettings'), { ssr: false });

const clusterButtonVariants = cva('btn col-12', {
    compoundVariants: [
        { active: true, className: 'border-primary text-primary', status: ClusterStatus.Connected },
        { active: true, className: 'border-warning text-warning', status: ClusterStatus.Connecting },
        { active: true, className: 'border-danger text-danger', status: ClusterStatus.Failure },
    ],
    defaultVariants: {
        active: false,
    },
    variants: {
        active: {
            false: 'btn-white',
            true: '',
        },
        status: {
            [ClusterStatus.Connected]: '',
            [ClusterStatus.Connecting]: '',
            [ClusterStatus.Failure]: '',
        },
    },
});

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

type InputProps = { status: ClusterStatus; active: boolean; savedClusters: SavedCluster[] };
function CustomClusterInput({ status, active, savedClusters }: InputProps) {
    const { customUrl } = useCluster();
    const updateCustomUrl = useUpdateCustomUrl();
    const addSavedCluster = useSetAtom(addSavedClusterAtom);
    const [editing, setEditing] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [savedName, setSavedName] = React.useState('');
    const [saveError, setSaveError] = React.useState<string | null>(null);
    const [localUrl, setLocalUrl] = React.useState(customUrl);
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    React.useEffect(() => {
        if (!editing) setLocalUrl(customUrl);
    }, [customUrl, editing]);

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
        setSaveError(null);
        try {
            addSavedCluster({ name: savedName.trim(), url: customUrl });
            setSavedName('');
            setSaving(false);
        } catch {
            setSaveError('Not enough storage space to save the cluster. Try removing unused clusters.');
        }
    };

    return (
        <>
            <Link
                className={cn(clusterButtonVariants({ active, status }), 'mb-3')}
                href={{ query: { cluster: 'custom', ...(customUrl.length > 0 ? { customUrl } : null) } }}
            >
                Custom RPC URL
            </Link>
            {active && (
                <>
                    <input
                        type="url"
                        value={localUrl}
                        aria-label="Custom RPC URL"
                        className={cn('form-control', !editing && 'text-muted')}
                        onFocus={() => setEditing(true)}
                        onBlur={() => setEditing(false)}
                        onChange={e => {
                            setLocalUrl(e.target.value);
                            onUrlInput(e.target.value);
                        }}
                    />
                    {saving ? (
                        <div className="col-12 mt-2 mb-3" data-testid="save-cluster-form">
                            <input
                                type="text"
                                className="form-control mb-2"
                                aria-label="Cluster name"
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
                            {saveError && (
                                <div className="alert alert-danger mt-2 mb-0 py-2" data-testid="save-cluster-error">
                                    {saveError}
                                </div>
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
                                        setSaveError(null);
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

function SavedClusterItem({
    cluster,
    status,
    isActive,
    onDelete,
}: {
    cluster: SavedCluster;
    status: ClusterStatus;
    isActive: boolean;
    onDelete: (name: string) => void;
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const nextSearchParams = new URLSearchParams(searchParams?.toString());
    nextSearchParams.set('cluster', 'custom');
    nextSearchParams.set('customUrl', cluster.url);
    const nextQueryString = nextSearchParams.toString();
    const clusterUrl = `${pathname}?${nextQueryString}`;

    return (
        <div className="position-relative col-12 mb-3" data-testid={`saved-cluster-${cluster.name}`}>
            <Link
                className={cn(clusterButtonVariants({ active: isActive, status }), 'text-center')}
                href={clusterUrl}
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
                <Trash2 size={14} />
            </button>
        </div>
    );
}

function SavedClustersSection({
    status,
    savedClusters,
}: {
    status: ClusterStatus;
    savedClusters: SavedCluster[];
}) {
    const { customUrl, cluster } = useCluster();
    const removeSavedCluster = useSetAtom(removeSavedClusterAtom);
    const router = useRouter();
    const pathname = usePathname();

    const handleDelete = (name: string) => {
        const isActive = cluster === Cluster.Custom && savedClusters.find(c => c.name === name)?.url === customUrl;
        removeSavedCluster(name);
        if (isActive) {
            router.push(pathname);
        }
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
                    status={status}
                    isActive={cluster === Cluster.Custom && customUrl === sc.url}
                    onDelete={handleDelete}
                />
            ))}
        </div>
    );
}

function ClusterToggle() {
    const { status, cluster } = useCluster();
    const savedClusters = useAtomValue(savedClustersAtom);
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
                            status={status}
                            active={active}
                            savedClusters={savedClusters}
                        />
                    );

                const nextSearchParams = new URLSearchParams(searchParams?.toString());
                const slug = clusterSlug(net);
                if (net !== DEFAULT_CLUSTER) {
                    nextSearchParams.set('cluster', slug);
                } else {
                    nextSearchParams.delete('cluster');
                }
                const nextQueryString = nextSearchParams.toString();
                const clusterUrl = `${pathname}${nextQueryString ? `?${nextQueryString}` : ''}`;
                return (
                    <Link
                        key={index}
                        className={cn(clusterButtonVariants({ active, status }), 'mb-3')}
                        href={clusterUrl}
                    >
                        {clusterName(net)}
                    </Link>
                );
            })}
            <SavedClustersSection status={status} savedClusters={savedClusters} />
        </div>
    );
}

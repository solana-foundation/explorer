'use client';

import {
    addSavedClusterAtom,
    removeSavedClusterAtom,
    type SavedCluster,
    savedClustersAtom,
} from '@features/custom-cluster';
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

import { Alert } from '../shared/ui/Alert';
import { FormControl } from '../shared/ui/FormControl';
import { Overlay } from './common/Overlay';
import { Button, buttonVariants } from './shared/ui/button';
import { cn } from './shared/utils';

const ClusterModalDeveloperSettings = dynamic(() => import('./ClusterModalDeveloperSettings'), { ssr: false });

// Base = dashkit Button base + full width (legacy `btn col-12`); active states keep the transparent
// base bg with the status color on border+text (legacy `border-* text-*` utilities).
const clusterButtonVariants = cva(cn(buttonVariants({ size: 'default', ui: 'dashkit' }), 'e-w-full'), {
    compoundVariants: [
        { active: true, className: 'e-border-[#1dd79b] e-text-[#1dd79b]', status: ClusterStatus.Connected },
        { active: true, className: 'e-border-[#fa62fc] e-text-[#fa62fc]', status: ClusterStatus.Connecting },
        { active: true, className: 'e-border-[#b45be1] e-text-[#b45be1]', status: ClusterStatus.Failure },
    ],
    defaultVariants: {
        active: false,
    },
    variants: {
        active: {
            false: 'e-bg-[#1e2423] e-border-[#343a37] e-text-white hover:e-bg-[#1a1f1e] hover:e-border-[#2a2e2c]',
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
            <div
                className={cn(
                    'e-fixed e-bottom-0 e-right-0 e-top-0 e-z-[1060] e-flex e-w-[350px] e-max-w-full e-flex-col e-border-0 e-border-l e-border-solid e-border-dk-black e-bg-dk-gray-800-dark e-transition-[transform,visibility] e-duration-300 e-ease-in-out',
                    show ? 'e-visible e-translate-x-0' : 'e-invisible e-translate-x-full',
                )}
            >
                <div className="e-relative e-flex-auto e-p-6" onClick={e => e.stopPropagation()}>
                    <span className="e-cursor-pointer" onClick={onClose}>
                        &times;
                    </span>

                    <h2 className="e-mb-6 e-mt-6 e-text-center">Choose a Cluster</h2>
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
    const [saveError, setSaveError] = React.useState<Error | undefined>(undefined);
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
        const name = savedName.trim();
        if (!name) return;
        setSaveError(undefined);
        try {
            new URL(localUrl);
        } catch {
            setSaveError(new Error('Please enter a valid URL before saving.'));
            return;
        }
        try {
            addSavedCluster({ name, url: localUrl });
            setSavedName('');
            setSaving(false);
        } catch (error) {
            setSaveError(
                new Error('Not enough storage space to save the cluster. Try removing unused clusters.', {
                    cause: error,
                }),
            );
        }
    };

    return (
        <>
            <Link
                className={cn(clusterButtonVariants({ active, status }), 'e-mb-3')}
                href={{ query: { cluster: 'custom', ...(customUrl.length > 0 ? { customUrl } : null) } }}
            >
                Custom RPC URL
            </Link>
            {active && (
                <>
                    <FormControl>
                        <input
                            type="url"
                            value={localUrl}
                            aria-label="Custom RPC URL"
                            className={cn(!editing && 'e-text-dk-gray-700')}
                            onFocus={() => setEditing(true)}
                            onBlur={() => setEditing(false)}
                            onChange={e => {
                                setLocalUrl(e.target.value);
                                onUrlInput(e.target.value);
                            }}
                        />
                    </FormControl>
                    {saving ? (
                        <div className="e-w-full e-mb-3 e-mt-1.5" data-testid="save-cluster-form">
                            <FormControl className="e-mb-1.5">
                                <input
                                    type="text"
                                    aria-label="Cluster name"
                                    placeholder="Cluster name"
                                    value={savedName}
                                    onChange={e => setSavedName(e.target.value)}
                                    data-testid="cluster-name-input"
                                    autoFocus
                                />
                            </FormControl>
                            {savedName.trim() === '' && (
                                <small className="e-text-dk-gray-700" data-testid="name-required-hint">
                                    Name is required
                                </small>
                            )}
                            {saveError && (
                                <Alert
                                    variant="danger"
                                    className="e-mb-0 e-mt-1.5 e-py-1.5"
                                    data-testid="save-cluster-error"
                                >
                                    {saveError.message}
                                </Alert>
                            )}
                            <div className="e-mt-[3px] e-flex e-gap-1.5">
                                <Button
                                    ui="dashkit"
                                    variant="primary"
                                    className="e-grow"
                                    onClick={handleSave}
                                    disabled={!savedName.trim()}
                                    data-testid="confirm-save-cluster-btn"
                                >
                                    Save
                                </Button>
                                <Button
                                    ui="dashkit"
                                    variant="white"
                                    className="e-grow"
                                    onClick={() => {
                                        setSaving(false);
                                        setSavedName('');
                                        setSaveError(undefined);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : !savedClusters.some(sc => sc.url === localUrl) ? (
                        <Button
                            ui="dashkit"
                            variant="white"
                            size="sm"
                            className="e-w-full e-mb-3 e-mt-1.5"
                            onClick={() => setSaving(true)}
                            data-testid="save-custom-cluster-btn"
                        >
                            Save this cluster
                        </Button>
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
        <div className="e-w-full e-relative e-mb-3" data-testid={`saved-cluster-${cluster.name}`}>
            <Link
                className={cn(clusterButtonVariants({ active: isActive, status }), 'e-text-center')}
                href={clusterUrl}
            >
                {cluster.name}
            </Link>
            <Button
                ui="dashkit"
                size="sm"
                className="e-absolute e-right-1 e-top-1/2 -e-translate-y-1/2"
                onClick={e => {
                    e.stopPropagation();
                    onDelete(cluster.name);
                }}
                data-testid={`delete-cluster-${cluster.name}`}
                aria-label={`Delete ${cluster.name}`}
            >
                <Trash2 size={14} />
            </Button>
        </div>
    );
}

function SavedClustersSection({ status, savedClusters }: { status: ClusterStatus; savedClusters: SavedCluster[] }) {
    const { customUrl, cluster } = useCluster();
    const removeSavedCluster = useSetAtom(removeSavedClusterAtom);
    const router = useRouter();
    const pathname = usePathname();

    const handleDelete = (name: string) => {
        const deletedCluster = savedClusters.find(c => c.name === name);
        const isActive = cluster === Cluster.Custom && deletedCluster?.url === customUrl;
        removeSavedCluster(name);
        const remaining = savedClusters.filter(c => c.name !== name);
        if (isActive && !remaining.some(c => c.url === customUrl)) {
            router.push(pathname);
        }
    };

    if (savedClusters.length === 0) return null;

    return (
        <div className="e-w-full" data-testid="saved-clusters-section">
            <hr />
            <h3 className="e-mb-3 e-text-center">Saved Clusters</h3>
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
        <div className="e-mb-6 e-flex e-flex-wrap">
            {CLUSTERS.map((net, index) => {
                const active = net === cluster;
                if (net === Cluster.Custom)
                    return (
                        <CustomClusterInput key={index} status={status} active={active} savedClusters={savedClusters} />
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
                        className={cn(clusterButtonVariants({ active, status }), 'e-mb-3')}
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

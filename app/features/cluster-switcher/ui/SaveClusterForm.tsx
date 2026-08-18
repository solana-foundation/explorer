'use client';

import { Button } from '@components/shared/ui/button';
import { Input } from '@components/shared/ui/input';
import { DEFAULT_RPC_ENDPOINT, parseRpcEndpoint } from '@entities/cluster';
import { Alert } from '@shared/ui/Alert';
import { useSetAtom } from 'jotai';
import { useState } from 'react';

import { MAX_CLUSTER_NAME_LENGTH, normalizeClusterName, suggestClusterName } from '../lib/cluster-name';
import { addSavedClusterAtom, type SavedCluster } from '../lib/cluster-storage';

type SaveClusterFormProps = {
    /** The endpoint to store. Taken from the field, so it can be half-typed or empty. */
    url: string;
    savedClusters: SavedCluster[];
};

// The "keep this endpoint under a name" flow. None of this state is the field's business, so it lives
// here rather than in `CustomClusterField`.
export function SaveClusterForm({ url, savedClusters }: SaveClusterFormProps) {
    const addSavedCluster = useSetAtom(addSavedClusterAtom);
    const [naming, setNaming] = useState(false);
    const [name, setName] = useState('');
    const [error, setError] = useState<Error | undefined>(undefined);

    // What the name would be stored as. Every decision below reads this rather than the raw field, so the
    // hint, the button and the write agree on one value.
    const clusterName = normalizeClusterName(name);

    // Opened with the host already filled in, so naming an endpoint is a click rather than a typing task.
    const open = () => {
        setName(
            suggestClusterName(
                url,
                savedClusters.map(saved => saved.name),
            ),
        );
        setNaming(true);
    };

    const close = () => {
        setNaming(false);
        setName('');
        setError(undefined);
    };

    const handleSave = () => {
        if (!clusterName) return;
        // The same check the reader applies, so the switcher cannot store an entry that is refused the
        // moment it is clicked. A plain `new URL` would accept `javascript:…` and bare `localhost:8899`.
        if (!parseRpcEndpoint(url)) {
            setError(new Error('Please enter a valid URL before saving.'));
            return;
        }
        try {
            addSavedCluster({ name: clusterName, url });
        } catch (cause) {
            // localStorage is the only failure mode here, and it is always the quota.
            setError(
                new Error('Not enough storage space to save the cluster. Try removing unused clusters.', { cause }),
            );
            return;
        }
        close();
    };

    if (!naming) {
        if (savedClusters.some(saved => saved.url === url)) return undefined;
        // The field still holds the endpoint the app filled in for itself: selecting Custom with no
        // `customUrl` falls back to the default, so the offer would otherwise appear the moment the pill
        // is clicked, naming a choice the user has not made yet.
        if (url === DEFAULT_RPC_ENDPOINT.href) return undefined;
        return (
            <Button
                ui="dashkit"
                variant="white"
                className="mb-3 mt-1.5 w-full"
                onClick={open}
                data-testid="save-custom-cluster-btn"
            >
                Save this cluster
            </Button>
        );
    }

    return (
        <div className="mb-3 mt-1.5 w-full" data-testid="save-cluster-form">
            {/* No `aria-invalid`: neither error this form can raise is about this field — one is about
                the URL above, the other about storage — so it would name the wrong control. An empty name
                is reported by the hint and the disabled Save button instead. */}
            <Input
                type="text"
                variant="dark"
                className="mb-1.5"
                aria-label="Cluster name"
                placeholder="Cluster name"
                value={name}
                onChange={e => setName(e.target.value)}
                // The cap the stored name is held to, repeated here so the field cannot show a name the
                // save would silently shorten.
                maxLength={MAX_CLUSTER_NAME_LENGTH}
                data-testid="cluster-name-input"
                autoFocus
            />
            {!clusterName && (
                <small className="text-dk-gray-700" data-testid="name-required-hint">
                    Name is required
                </small>
            )}
            {error && (
                <Alert variant="danger" className="mb-0 mt-1.5 py-1.5" data-testid="save-cluster-error">
                    {error.message}
                </Alert>
            )}
            <div className="mt-[3px] flex gap-1.5">
                <Button
                    ui="dashkit"
                    variant="primary"
                    className="grow"
                    onClick={handleSave}
                    disabled={!clusterName}
                    data-testid="confirm-save-cluster-btn"
                >
                    Save
                </Button>
                <Button ui="dashkit" variant="white" className="grow" onClick={close}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}

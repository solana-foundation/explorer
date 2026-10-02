'use client';

import { Button } from '@components/shared/ui/button';
import { Input } from '@components/shared/ui/input';
import { Switch } from '@components/shared/ui/switch';
import { cn } from '@components/shared/utils';
import { customUrlEnabledAtom, DEFAULT_RPC_ENDPOINT, parseRpcEndpoint, useCluster } from '@entities/cluster';
import {
    type SavedCluster,
    suggestClusterName,
    useClusterHref,
    useCustomUrlDraft,
    useSavedClusters,
} from '@features/cluster-switcher/client';
import { scrollToTop } from '@shared/lib/scrollToTop';
import { Cluster, clusterName, CLUSTERS, clusterSlug, ClusterStatus } from '@utils/cluster';
import { useAtom } from 'jotai';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { Plus } from 'react-feather';

import {
    ACTIVE_ROW,
    INACTIVE_ROW,
    MENU_FIELD_BORDER,
    MENU_PRIMARY_BUTTON,
    MENU_SECONDARY_BUTTON,
    rowClasses,
} from './cluster-row-classes';
import { CustomUrlConsentDialog } from './CustomUrlConsentDialog';
import { EndpointForm } from './EndpointForm';
import { KnownMark } from './provenance-mark';
import { SavedEndpointRow } from './SavedEndpointRow';

const STATUS_LABEL: Record<ClusterStatus, { colour: string; label: string }> = {
    [ClusterStatus.Connected]: { colour: '#1dd79b', label: 'connected' },
    [ClusterStatus.Connecting]: { colour: '#fa62fc', label: 'connecting' },
    [ClusterStatus.Failure]: { colour: '#b45be1', label: 'not connected' },
};

const SECTION_CAPTION = 'px-3 text-xs font-normal uppercase text-outer-space-300';

const SAVED_LIST_FADE_MASK = 'linear-gradient(to bottom, #000 calc(100% - 28px), transparent)';

export function ClusterMenu({ onDismiss }: { onDismiss: () => void }) {
    const { cluster, endpoint, status } = useCluster();
    const { addSavedCluster, savedClusters } = useSavedClusters();
    const buildHref = useClusterHref();
    const draft = useCustomUrlDraft({ commitOnType: false });
    const [saving, setSaving] = useState(false);

    const pinned: SavedCluster = { name: 'Default', url: DEFAULT_RPC_ENDPOINT.href };
    const showPinned = !savedClusters.some(saved => saved.url === pinned.url);
    const listed = showPinned ? [pinned, ...savedClusters] : savedClusters;

    const onCustom = cluster === Cluster.Custom;
    const customIsLive = onCustom && !listed.some(saved => saved.url === endpoint?.href);
    const draftEndpoint = parseRpcEndpoint(draft.value);

    const savedRef = useRef<HTMLUListElement>(null);
    const [showSavedFade, setShowSavedFade] = useState(false);
    useEffect(() => {
        const el = savedRef.current;
        if (!el) return;
        const update = () =>
            setShowSavedFade(
                el.scrollHeight > el.clientHeight + 1 && el.scrollTop + el.clientHeight < el.scrollHeight - 1,
            );
        update();
        el.addEventListener('scroll', update, { passive: true });
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => {
            el.removeEventListener('scroll', update);
            observer.disconnect();
        };
    }, [listed.length]);

    const facts = (
        <span
            className="flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em]"
            style={{ color: STATUS_LABEL[status].colour }}
        >
            {STATUS_LABEL[status].label}
        </span>
    );

    return (
        <div className="flex min-h-0 flex-col">
            <div className={cn(SECTION_CAPTION, 'shrink-0 pb-2 pt-2')}>Cluster</div>

            <ul className="m-0 flex shrink-0 list-none flex-col gap-0.5 p-0">
                {CLUSTERS.filter(net => net !== Cluster.Custom).map(net => {
                    const active = net === cluster;
                    return (
                        <li key={clusterSlug(net)}>
                            <Link
                                href={buildHref({ cluster: net })}
                                scroll={false}
                                onClick={() => {
                                    scrollToTop();
                                    onDismiss();
                                }}
                                aria-current={active ? 'true' : undefined}
                                className={rowClasses({ active })}
                            >
                                <span className="flex items-center gap-1.5">
                                    {clusterName(net)}
                                    <KnownMark withLabel={active} />
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>

            {listed.length > 0 && (
                <>
                    <div className={cn(SECTION_CAPTION, 'shrink-0 pb-2 pt-6')}>Your endpoints</div>
                    <ul
                        ref={savedRef}
                        style={
                            showSavedFade
                                ? { WebkitMaskImage: SAVED_LIST_FADE_MASK, maskImage: SAVED_LIST_FADE_MASK }
                                : undefined
                        }
                        className={cn(
                            'm-0 flex max-h-[250px] min-h-0 list-none flex-col gap-0.5 overflow-y-auto overscroll-contain p-0',
                            '[&::-webkit-scrollbar]:w-2',
                            '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-outer-space-600 [&::-webkit-scrollbar-thumb]:hover:bg-outer-space-500',
                            '[&::-webkit-scrollbar-track]:bg-transparent',
                        )}
                        data-testid="saved-clusters-section"
                    >
                        {listed.map(saved => (
                            <SavedEndpointRow
                                key={saved.url}
                                entry={saved}
                                pinned={saved.url === pinned.url && showPinned}
                                active={!customIsLive && endpoint?.href === saved.url}
                                facts={facts}
                                onPick={() => {
                                    draft.select(saved.url);
                                    onDismiss();
                                }}
                            />
                        ))}
                    </ul>
                </>
            )}

            <div className={cn(SECTION_CAPTION, 'shrink-0 pb-2 pt-6')}>Custom RPC URL</div>

            <div
                className={cn(
                    'flex w-full shrink-0 flex-col gap-1.5 rounded-md border border-solid px-3 pb-3 pt-2',
                    customIsLive ? ACTIVE_ROW : INACTIVE_ROW,
                )}
                data-testid="custom-field-plate"
            >
                {saving && draftEndpoint ? (
                    <EndpointForm
                        url={draft.value}
                        initialName={suggestClusterName(
                            draft.value,
                            savedClusters.map(c => c.name),
                        )}
                        onSave={name => {
                            addSavedCluster({ name, url: draft.value });
                            setSaving(false);
                        }}
                        onCancel={() => setSaving(false)}
                    />
                ) : (
                    <>
                        <div className="relative">
                            <Input
                                type="url"
                                variant="dark"
                                className={cn(
                                    'pr-10 font-mono focus-visible:!ring-1 focus-visible:!ring-accent focus-visible:!ring-offset-0',
                                    MENU_FIELD_BORDER,
                                )}
                                placeholder="https://"
                                value={draft.value}
                                onChange={e => draft.onChange(e.target.value)}
                                onKeyDown={event => {
                                    if (event.key !== 'Enter' || !parseRpcEndpoint(draft.value)) return;
                                    event.preventDefault();
                                    event.currentTarget.blur();
                                    draft.select(draft.value);
                                    onDismiss();
                                }}
                                aria-label="Custom RPC URL"
                                data-testid="cluster-url-input"
                            />
                            <Button
                                variant="accent"
                                size="sm"
                                className={cn('absolute inset-y-1 right-1 !h-auto', MENU_PRIMARY_BUTTON)}
                                disabled={!draftEndpoint}
                                title={draftEndpoint ? 'Use this endpoint' : 'Enter a full RPC URL to use it'}
                                onClick={() => {
                                    draft.select(draft.value);
                                    onDismiss();
                                }}
                                data-testid="go-custom-cluster-btn"
                            >
                                Go
                            </Button>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn('self-start', MENU_SECONDARY_BUTTON)}
                            disabled={!draftEndpoint}
                            onClick={() => setSaving(true)}
                            data-testid="open-save-cluster-btn"
                        >
                            <Plus size={14} aria-hidden />
                            Save…
                        </Button>
                    </>
                )}
            </div>

            <div className="-mx-1.5 my-2 h-px shrink-0 bg-outer-space-800" role="presentation" />
            <TrustRow />
        </div>
    );
}

function TrustRow() {
    const [enabled, setEnabled] = useAtom(customUrlEnabledAtom);
    const [confirming, setConfirming] = useState(false);

    const onCheckedChange = (next: boolean) => {
        if (!next) {
            setEnabled(false);
            return;
        }
        setConfirming(true);
    };

    return (
        <div className="flex shrink-0 items-start justify-between gap-3 px-3 pb-1.5 pt-1">
            <label htmlFor="nav-cluster-trust-toggle" className="flex min-w-0 cursor-pointer flex-col leading-tight">
                <span className="text-sm text-white">Trust any RPC server</span>
                <span className="mt-1 text-xs text-outer-space-300">
                    <span className={cn(enabled && 'text-dk-danger')}>Unsafe.</span> Lets links connect to their own
                    server without asking. Only for your own endpoints.
                </span>
            </label>
            <Switch
                id="nav-cluster-trust-toggle"
                className="-mr-0.5 mt-0.5 data-[state=checked]:!bg-accent data-[state=unchecked]:!bg-neutral-600"
                checked={enabled}
                onCheckedChange={onCheckedChange}
            />
            <CustomUrlConsentDialog
                request={confirming ? { kind: 'developer-bypass' } : undefined}
                onConfirm={() => {
                    setEnabled(true);
                    setConfirming(false);
                }}
                onCancel={() => setConfirming(false)}
            />
        </div>
    );
}

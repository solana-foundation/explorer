'use client';

import { Button } from '@components/shared/ui/button';
import { IconButton } from '@components/shared/ui/icon-button';
import { cn } from '@components/shared/utils';
import { parseRpcEndpoint } from '@entities/cluster';
import { type SavedCluster, useSavedClusters } from '@features/cluster-switcher/client';
import React, { useEffect, useState } from 'react';
import { Edit2, Trash2 } from 'react-feather';

import { endpointProvenance } from '../lib/endpoint-provenance';
import { MENU_SECONDARY_BUTTON, rowClasses } from './cluster-row-classes';
import { EndpointForm } from './EndpointForm';
import { KnownMark, UnknownMark } from './provenance-mark';

const HOVER_FROM_GROUP =
    '[@media(hover:hover)]:group-hover/row:border-white/10 [@media(hover:hover)]:group-hover/row:bg-outer-space-800';

const UNDO_WINDOW_MS = 10_000;

export function SavedEndpointRow({
    active,
    facts,
    entry,
    onDelete,
    onPick,
    pinned,
}: {
    active: boolean;
    facts?: React.ReactNode;
    entry: SavedCluster;
    onDelete?: () => void;
    onPick: () => void;
    pinned?: boolean;
}) {
    const { removeSavedCluster, restoreSavedCluster, savedClusters, updateSavedCluster } = useSavedClusters();
    const [editing, setEditing] = useState(false);
    const [removed, setRemoved] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (removed === undefined) return;
        const timer = setTimeout(() => setRemoved(undefined), UNDO_WINDOW_MS);
        return () => clearTimeout(timer);
    }, [removed]);

    const savedEndpoint = parseRpcEndpoint(entry.url);
    const heading = entry.name || savedEndpoint?.host || entry.url;
    const provenance = endpointProvenance(entry.url);
    const title = entry.name === '' ? entry.url : `${entry.name} — ${entry.url}`;

    if (editing)
        return (
            <li data-testid={`saved-cluster-${entry.url}`}>
                <EndpointForm
                    url={entry.url}
                    initialName={entry.name}
                    onSave={name => {
                        updateSavedCluster({ name, url: entry.url });
                        setEditing(false);
                    }}
                    onCancel={() => setEditing(false)}
                />
            </li>
        );

    const rowClass = cn(rowClasses({ active, stacked: true }), 'pr-14', HOVER_FROM_GROUP);

    const mark =
        provenance === 'known' ? (
            <KnownMark withLabel={active} />
        ) : provenance === 'unknown' ? (
            <UnknownMark withLabel={active} />
        ) : undefined;

    const contents = (
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="flex min-w-0 items-center gap-1.5">
                <span
                    className={cn(
                        'truncate text-sm font-medium text-white',
                        entry.name === '' && 'font-mono',
                        removed !== undefined && 'line-through opacity-60',
                    )}
                >
                    {heading}
                </span>
                {mark !== undefined && <span className="flex shrink-0 items-center">{mark}</span>}
            </span>
            {savedEndpoint && entry.name !== '' && savedEndpoint.host !== entry.name && (
                <span className="block truncate font-mono text-xs text-outer-space-300">{savedEndpoint.host}</span>
            )}
            {active && facts !== undefined && (
                <span className="mt-1 flex min-w-0 flex-wrap items-center gap-1">{facts}</span>
            )}
        </span>
    );

    if (removed !== undefined)
        return (
            <li className="group/row relative" data-testid={`saved-cluster-${entry.url}`}>
                <div className={cn(rowClass, 'cursor-default')} aria-disabled>
                    {contents}
                </div>
                <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5">
                    <Button
                        variant="outline"
                        size="sm"
                        className={MENU_SECONDARY_BUTTON}
                        onClick={() => {
                            restoreSavedCluster({ ...entry, at: removed });
                            setRemoved(undefined);
                        }}
                        data-testid={`restore-cluster-${entry.url}`}
                    >
                        Restore
                    </Button>
                </span>
            </li>
        );

    return (
        <li className="group/row relative" data-testid={`saved-cluster-${entry.url}`}>
            <button
                type="button"
                onClick={onPick}
                title={title}
                aria-current={active ? 'true' : undefined}
                className={cn(rowClass, 'text-left')}
                data-testid={`pick-cluster-${entry.url}`}
            >
                {contents}
            </button>
            {!pinned && (
                <span className="pointer-events-none absolute right-1.5 top-1.5 flex items-center gap-0.5">
                    <RowControl
                        label={entry.name === '' ? `Name ${heading}` : `Rename ${entry.name}`}
                        title={entry.name === '' ? 'Name this endpoint' : 'Rename this endpoint'}
                        onClick={() => setEditing(true)}
                        testId={`rename-cluster-${entry.url}`}
                    >
                        <Edit2 size={14} aria-hidden />
                    </RowControl>
                    <RowControl
                        label={`Delete ${heading}`}
                        title="Delete this endpoint"
                        danger
                        onClick={() => {
                            const at = savedClusters.findIndex(c => c.url === entry.url);
                            removeSavedCluster(entry.url);
                            onDelete?.();
                            setRemoved(at < 0 ? 0 : at);
                        }}
                        testId={`delete-cluster-${entry.url}`}
                    >
                        <Trash2 size={14} aria-hidden />
                    </RowControl>
                </span>
            )}
        </li>
    );
}

function RowControl({
    children,
    danger,
    label,
    onClick,
    testId,
    title,
}: {
    children: React.ReactNode;
    danger?: boolean;
    label: string;
    onClick: () => void;
    testId: string;
    title: string;
}) {
    return (
        <IconButton
            variant="ghost"
            aria-label={label}
            title={title}
            onClick={onClick}
            className={cn(
                'pointer-events-auto cursor-pointer !text-neutral-300 opacity-0 transition-[opacity,color] [&_svg]:!size-3.5',
                'focus-visible:opacity-100 [@media(hover:hover)]:group-hover/row:opacity-100 [@media(hover:none)]:opacity-100',
                danger ? '[@media(hover:hover)]:hover:!text-[#b45be1]' : '[@media(hover:hover)]:hover:!text-white',
            )}
            data-testid={testId}
            icon={children}
        />
    );
}

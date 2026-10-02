'use client';

import { Button } from '@components/shared/ui/button';
import { Input } from '@components/shared/ui/input';
import { parseRpcEndpoint } from '@entities/cluster';
import { MAX_CLUSTER_NAME_LENGTH } from '@features/cluster-switcher/client';
import React, { useState } from 'react';

import { MENU_FIELD_BORDER, MENU_PRIMARY_BUTTON, MENU_SECONDARY_BUTTON } from './cluster-row-classes';

export function EndpointForm({
    error,
    initialName = '',
    onCancel,
    onSave,
    url,
}: {
    error?: string;
    initialName?: string;
    onCancel: () => void;
    onSave: (name: string) => void;
    url: string;
}) {
    const [name, setName] = useState(initialName);
    const host = parseRpcEndpoint(url)?.host ?? url;

    const onKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            onSave(name.trim());
        }
        if (event.key === 'Escape') {
            event.stopPropagation();
            onCancel();
        }
    };

    return (
        <div className="flex w-full flex-col gap-1.5 text-sm text-white" data-testid="save-cluster-form">
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-outer-space-300">
                Name this endpoint
            </span>
            <Input
                type="text"
                variant="dark"
                className={MENU_FIELD_BORDER}
                aria-label={`Name for ${host}`}
                placeholder="Endpoint name"
                value={name}
                maxLength={MAX_CLUSTER_NAME_LENGTH}
                onChange={e => setName(e.target.value)}
                onKeyDown={onKeyDown}
                data-testid="cluster-name-input"
                autoFocus
            />
            <span className="block truncate font-mono text-[11px] text-outer-space-300" title={url}>
                {url}
            </span>
            {error && (
                <span className="text-xs leading-snug text-[#b45be1]" data-testid="save-cluster-error">
                    {error}
                </span>
            )}
            <span className="flex items-center gap-2">
                <Button
                    variant="accent"
                    size="sm"
                    className={MENU_PRIMARY_BUTTON}
                    onClick={() => onSave(name.trim())}
                    title="Save this endpoint"
                    data-testid="confirm-save-cluster-btn"
                >
                    Save
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className={MENU_SECONDARY_BUTTON}
                    onClick={onCancel}
                    data-testid="cancel-save-cluster-btn"
                >
                    Cancel
                </Button>
            </span>
        </div>
    );
}

'use client';

import { FOCUS_RULE_CLASSES, focusRuleStyle, isKeyboardFocus } from '@components/shared/focus-rule';
import { Popover, PopoverContent, PopoverTrigger } from '@components/shared/ui/popover';
import { cn } from '@components/shared/utils';
import { useCluster } from '@entities/cluster';
import { ClusterStatus } from '@utils/cluster';
import React from 'react';
import { ChevronDown } from 'react-feather';

import { endpointName } from '../lib/endpoint-name';
import { endpointProvenance } from '../lib/endpoint-provenance';
import { ClusterMenu } from './ClusterMenu';
import { KNOWN_COLOUR, PROVENANCE_MARK, UNKNOWN_COLOUR } from './provenance-mark';

const STATUS_STYLE: Record<ClusterStatus, { colour: string; label: string }> = {
    [ClusterStatus.Connected]: { colour: KNOWN_COLOUR, label: 'Connected' },
    [ClusterStatus.Connecting]: { colour: UNKNOWN_COLOUR, label: 'Connecting' },
    [ClusterStatus.Failure]: { colour: '#e0526e', label: 'Not connected' },
};

const CONNECTED_GREY = 'oklch(70.297% 0.0218 185.24)';

export interface ClusterDropdownProps {
    align?: 'end' | 'start';
    className?: string;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
}

export function ClusterDropdown({ align = 'end', className, onOpenChange, open }: ClusterDropdownProps) {
    const { status, name, endpoint } = useCluster();
    const [focused, setFocused] = React.useState(false);

    const label = endpoint ? endpointName(endpoint) : name;
    const { label: statusLabel } = STATUS_STYLE[status];

    const provenance = endpointProvenance(endpoint?.href);
    const lead = provenance ? PROVENANCE_MARK[provenance] : undefined;
    const LeadGlyph = lead?.glyph;
    const factsColour = status === ClusterStatus.Connected ? CONNECTED_GREY : STATUS_STYLE[status].colour;

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label={`Cluster: ${label}. ${statusLabel}. Change cluster`}
                    title={`${label} · ${statusLabel}`}
                    style={focusRuleStyle(focused || Boolean(open))}
                    onFocus={event => setFocused(isKeyboardFocus(event.currentTarget))}
                    onBlur={() => setFocused(false)}
                    className={cn(
                        'group flex h-[38px] min-w-0 cursor-pointer items-center gap-1 overflow-hidden rounded-md border border-solid border-outer-space-700 bg-heavy-metal-800 px-1.5 text-left leading-none transition-colors hover:border-outer-space-600 data-[state=open]:border-outer-space-500 sm:px-2',
                        FOCUS_RULE_CLASSES,
                        className,
                    )}
                >
                    <span className="flex min-w-0 flex-1 translate-y-px flex-col items-stretch justify-center gap-0.5">
                        <span className="flex min-w-0 items-center gap-0.5 text-sm leading-[14px] text-white">
                            {lead && LeadGlyph && (
                                <span className="flex shrink-0 items-center" style={{ color: lead.colour }}>
                                    <LeadGlyph size={12} />
                                </span>
                            )}
                            <span className="min-w-0 truncate" style={lead ? { color: lead.colour } : undefined}>
                                {label}
                            </span>
                        </span>
                        <span
                            className="min-w-0 -translate-y-px truncate text-[10px] uppercase leading-[12px] tracking-[0.08em]"
                            style={{ color: factsColour }}
                        >
                            {statusLabel}
                        </span>
                    </span>
                    <ChevronDown
                        size={14}
                        aria-hidden
                        className="shrink-0 translate-y-px text-neutral-400 transition-transform duration-200 group-data-[state=open]:rotate-180"
                    />
                </button>
            </PopoverTrigger>

            <PopoverContent
                align={align}
                sideOffset={4}
                collisionPadding={16}
                className="flex max-h-[var(--radix-popover-content-available-height)] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden p-1.5 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.9)]"
            >
                <ClusterMenu onDismiss={() => onOpenChange?.(false)} />
            </PopoverContent>
        </Popover>
    );
}

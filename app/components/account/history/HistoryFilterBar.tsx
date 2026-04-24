'use client';

import { Button } from '@components/shared/ui/button';
import { Input } from '@components/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@components/shared/ui/popover';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { Filter, X } from 'react-feather';

export const AFTER_SLOT_PARAM = 'afterSlot';
export const BEFORE_SLOT_PARAM = 'beforeSlot';

export type SlotFilters = {
    afterSlot: number | undefined;
    beforeSlot: number | undefined;
};

function parseSlotParam(raw: string | null | undefined): number | undefined {
    if (!raw) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : undefined;
}

export function useSlotFilters(): SlotFilters {
    const searchParams = useSearchParams();
    return {
        afterSlot: parseSlotParam(searchParams?.get(AFTER_SLOT_PARAM)),
        beforeSlot: parseSlotParam(searchParams?.get(BEFORE_SLOT_PARAM)),
    };
}

function useUpdateSlotFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    return React.useCallback(
        (next: Partial<SlotFilters>) => {
            const params = new URLSearchParams(searchParams?.toString() ?? '');
            const setParam = (key: string, value: number | undefined) => {
                if (value === undefined) {
                    params.delete(key);
                } else {
                    params.set(key, String(value));
                }
            };
            if ('afterSlot' in next) setParam(AFTER_SLOT_PARAM, next.afterSlot);
            if ('beforeSlot' in next) setParam(BEFORE_SLOT_PARAM, next.beforeSlot);
            const qs = params.toString();
            router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
        },
        [router, pathname, searchParams],
    );
}

function slotDraftToValue(raw: string): number | undefined | 'invalid' {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) return 'invalid';
    return Math.floor(parsed);
}

function FilterChip({ label, value, onClear }: { label: string; value: number; onClear: () => void }) {
    return (
        <span className="badge bg-info-soft d-inline-flex align-items-center gap-1">
            <span>
                {label}: {value.toLocaleString()}
            </span>
            <button
                type="button"
                onClick={onClear}
                aria-label={`Clear ${label.toLowerCase()} filter`}
                className="btn btn-link btn-sm p-0 text-muted d-inline-flex align-items-center"
                style={{ lineHeight: 0 }}
            >
                <X size={12} />
            </button>
        </span>
    );
}

export function HistoryFilterChips({ afterSlot, beforeSlot }: SlotFilters) {
    const updateFilters = useUpdateSlotFilters();
    if (afterSlot === undefined && beforeSlot === undefined) return null;
    return (
        <>
            {afterSlot !== undefined && (
                <FilterChip
                    label="After slot"
                    value={afterSlot}
                    onClear={() => updateFilters({ afterSlot: undefined })}
                />
            )}
            {beforeSlot !== undefined && (
                <FilterChip
                    label="Before slot"
                    value={beforeSlot}
                    onClear={() => updateFilters({ beforeSlot: undefined })}
                />
            )}
        </>
    );
}

export function HistoryFilterTrigger({ afterSlot, beforeSlot }: SlotFilters) {
    const updateFilters = useUpdateSlotFilters();
    const [open, setOpen] = React.useState(false);
    const [afterDraft, setAfterDraft] = React.useState<string>(afterSlot !== undefined ? String(afterSlot) : '');
    const [beforeDraft, setBeforeDraft] = React.useState<string>(beforeSlot !== undefined ? String(beforeSlot) : '');

    React.useEffect(() => {
        setAfterDraft(afterSlot !== undefined ? String(afterSlot) : '');
        setBeforeDraft(beforeSlot !== undefined ? String(beforeSlot) : '');
    }, [afterSlot, beforeSlot, open]);

    const afterValue = slotDraftToValue(afterDraft);
    const beforeValue = slotDraftToValue(beforeDraft);
    const afterInvalid = afterValue === 'invalid';
    const beforeInvalid = beforeValue === 'invalid';
    const rangeInvalid =
        typeof afterValue === 'number' && typeof beforeValue === 'number' && afterValue > beforeValue;
    const hasError = afterInvalid || beforeInvalid || rangeInvalid;

    const apply = () => {
        if (hasError) return;
        updateFilters({ afterSlot: afterValue, beforeSlot: beforeValue });
        setOpen(false);
    };

    const clearAll = () => {
        updateFilters({ afterSlot: undefined, beforeSlot: undefined });
        setOpen(false);
    };

    const activeCount = (afterSlot !== undefined ? 1 : 0) + (beforeSlot !== undefined ? 1 : 0);
    const triggerLabel = activeCount === 0 ? 'Filters' : 'Edit filters';

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button size="sm" variant="outline">
                    <Filter />
                    {triggerLabel}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="e-p-3 e-w-72">
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        apply();
                    }}
                    className="e-flex e-flex-col e-gap-3"
                >
                    <div className="e-flex e-flex-col e-gap-1">
                        <label className="e-text-xs e-text-neutral-300">After slot</label>
                        <Input
                            autoFocus
                            variant="dark"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="lower bound (optional)"
                            value={afterDraft}
                            aria-invalid={afterInvalid || rangeInvalid}
                            onChange={e => setAfterDraft(e.target.value)}
                        />
                    </div>
                    <div className="e-flex e-flex-col e-gap-1">
                        <label className="e-text-xs e-text-neutral-300">Before slot</label>
                        <Input
                            variant="dark"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="upper bound (optional)"
                            value={beforeDraft}
                            aria-invalid={beforeInvalid || rangeInvalid}
                            onChange={e => setBeforeDraft(e.target.value)}
                        />
                    </div>
                    {rangeInvalid && (
                        <div className="e-text-xs e-text-red-400">After slot must be ≤ before slot.</div>
                    )}
                    <div className="e-flex e-justify-end e-gap-2 e-pt-1">
                        {activeCount > 0 && (
                            <Button type="button" size="sm" variant="ghost" onClick={clearAll}>
                                Clear all
                            </Button>
                        )}
                        <Button type="submit" size="sm" variant="accent" disabled={hasError}>
                            Apply
                        </Button>
                    </div>
                </form>
            </PopoverContent>
        </Popover>
    );
}

// Combined bar kept for tests / any consumer that wants chips + trigger inline.
export function HistoryFilterBar(props: SlotFilters) {
    return (
        <div className="d-flex align-items-center gap-2 flex-wrap">
            <HistoryFilterChips {...props} />
            <HistoryFilterTrigger {...props} />
        </div>
    );
}

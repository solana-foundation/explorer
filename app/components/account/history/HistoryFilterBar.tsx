'use client';

import { Badge } from '@components/shared/ui/badge';
import { Button } from '@components/shared/ui/button';
import { Input } from '@components/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@components/shared/ui/popover';
import { HistoryFilters, useHistoryFiltersSupported } from '@providers/accounts/history';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { Filter, X } from 'react-feather';

// URL params map one-to-one onto the Triton `getTransactionsForAddress` filter paths.
export const SLOT_GTE_PARAM = 'slot.gte';
export const SLOT_LTE_PARAM = 'slot.lte';
export const BLOCK_TIME_GTE_PARAM = 'blockTime.gte';
export const BLOCK_TIME_LTE_PARAM = 'blockTime.lte';
export const STATUS_PARAM = 'status';

const STATUS_VALUES = ['succeeded', 'failed'] as const;

const STATUS_LABELS: Record<(typeof STATUS_VALUES)[number], string> = {
    failed: 'Failed',
    succeeded: 'Succeeded',
};

function parseSlotParam(raw: string | null | undefined): number | undefined {
    if (!raw) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : undefined;
}

function parseEnumParam<T extends string>(raw: string | null | undefined, allowed: readonly T[]): T | undefined {
    return raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : undefined;
}

// Collapses an undefined-only range back to `undefined` so consumers can treat a
// present range object as "this filter is active".
function toRange(gte: number | undefined, lte: number | undefined) {
    return gte === undefined && lte === undefined ? undefined : { gte, lte };
}

export function useHistoryFilters(): HistoryFilters {
    const searchParams = useSearchParams();
    return {
        blockTime: toRange(
            parseSlotParam(searchParams?.get(BLOCK_TIME_GTE_PARAM)),
            parseSlotParam(searchParams?.get(BLOCK_TIME_LTE_PARAM)),
        ),
        slot: toRange(
            parseSlotParam(searchParams?.get(SLOT_GTE_PARAM)),
            parseSlotParam(searchParams?.get(SLOT_LTE_PARAM)),
        ),
        status: parseEnumParam(searchParams?.get(STATUS_PARAM), STATUS_VALUES),
    };
}

// Update operates directly on URL param names so callers reference the same gTFA paths.
type ParamUpdate = Record<string, number | string | undefined>;

function useUpdateHistoryFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    return React.useCallback(
        (next: ParamUpdate) => {
            const params = new URLSearchParams(searchParams?.toString() ?? '');
            Object.entries(next).forEach(([key, value]) => {
                if (value === undefined) {
                    params.delete(key);
                } else {
                    params.set(key, String(value));
                }
            });
            const qs = params.toString();
            router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
        },
        [router, pathname, searchParams],
    );
}

// Clears every filter param from the URL in one update.
export function useClearHistoryFilters() {
    const updateFilters = useUpdateHistoryFilters();
    return React.useCallback(
        () =>
            updateFilters({
                [BLOCK_TIME_GTE_PARAM]: undefined,
                [BLOCK_TIME_LTE_PARAM]: undefined,
                [SLOT_GTE_PARAM]: undefined,
                [SLOT_LTE_PARAM]: undefined,
                [STATUS_PARAM]: undefined,
            }),
        [updateFilters],
    );
}

function slotDraftToValue(raw: string): number | undefined | 'invalid' {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) return 'invalid';
    return Math.floor(parsed);
}

// datetime-local <-> unix seconds (local time, matching what the input displays).
function unixToLocalInput(sec: number | undefined): string {
    if (sec === undefined) return '';
    const d = new Date(sec * 1000);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
        d.getMinutes(),
    )}`;
}

function localInputToUnix(raw: string): number | undefined {
    if (!raw) return undefined;
    const ms = new Date(raw).getTime();
    return Number.isFinite(ms) ? Math.floor(ms / 1000) : undefined;
}

function FilterChip({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
    return (
        <Badge ui="dashkit" variant="info" className="inline-flex items-center gap-1">
            <span>
                {label}: {value}
            </span>
            <button
                type="button"
                onClick={onClear}
                aria-label={`Clear ${label.toLowerCase()} filter`}
                className="inline-flex items-center justify-center border-0 bg-transparent p-0 leading-none text-current opacity-70 hover:opacity-100"
            >
                <X size={12} />
            </button>
        </Badge>
    );
}

export function HistoryFilterChips(filters: HistoryFilters) {
    const { slot, blockTime, status } = filters;
    const updateFilters = useUpdateHistoryFilters();
    const hasAny = slot !== undefined || blockTime !== undefined || status !== undefined;
    if (!hasAny) return undefined;
    return (
        <>
            {slot?.gte !== undefined && (
                <FilterChip
                    label="Slot ≥"
                    value={slot.gte.toLocaleString()}
                    onClear={() => updateFilters({ [SLOT_GTE_PARAM]: undefined })}
                />
            )}
            {slot?.lte !== undefined && (
                <FilterChip
                    label="Slot ≤"
                    value={slot.lte.toLocaleString()}
                    onClear={() => updateFilters({ [SLOT_LTE_PARAM]: undefined })}
                />
            )}
            {status !== undefined && (
                <FilterChip
                    label="Status"
                    value={STATUS_LABELS[status]}
                    onClear={() => updateFilters({ [STATUS_PARAM]: undefined })}
                />
            )}
            {blockTime?.gte !== undefined && (
                <FilterChip
                    label="Block time ≥"
                    value={new Date(blockTime.gte * 1000).toLocaleString()}
                    onClear={() => updateFilters({ [BLOCK_TIME_GTE_PARAM]: undefined })}
                />
            )}
            {blockTime?.lte !== undefined && (
                <FilterChip
                    label="Block time ≤"
                    value={new Date(blockTime.lte * 1000).toLocaleString()}
                    onClear={() => updateFilters({ [BLOCK_TIME_LTE_PARAM]: undefined })}
                />
            )}
        </>
    );
}

const SELECT_CLASS = 'w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100';

export function HistoryFilterTrigger(filters: HistoryFilters) {
    const { slot, blockTime, status } = filters;
    const updateFilters = useUpdateHistoryFilters();
    const supported = useHistoryFiltersSupported();
    const [open, setOpen] = React.useState(false);

    const [slotGteDraft, setSlotGteDraft] = React.useState('');
    const [slotLteDraft, setSlotLteDraft] = React.useState('');
    const [statusDraft, setStatusDraft] = React.useState('');
    const [blockTimeGteDraft, setBlockTimeGteDraft] = React.useState('');
    const [blockTimeLteDraft, setBlockTimeLteDraft] = React.useState('');

    React.useEffect(() => {
        setSlotGteDraft(slot?.gte !== undefined ? String(slot.gte) : '');
        setSlotLteDraft(slot?.lte !== undefined ? String(slot.lte) : '');
        setStatusDraft(status ?? '');
        setBlockTimeGteDraft(unixToLocalInput(blockTime?.gte));
        setBlockTimeLteDraft(unixToLocalInput(blockTime?.lte));
    }, [slot, blockTime, status, open]);

    const slotGteValue = slotDraftToValue(slotGteDraft);
    const slotLteValue = slotDraftToValue(slotLteDraft);
    const blockTimeGteValue = localInputToUnix(blockTimeGteDraft);
    const blockTimeLteValue = localInputToUnix(blockTimeLteDraft);

    const slotGteInvalid = slotGteValue === 'invalid';
    const slotLteInvalid = slotLteValue === 'invalid';
    const slotRangeInvalid =
        typeof slotGteValue === 'number' && typeof slotLteValue === 'number' && slotGteValue > slotLteValue;
    const timeRangeInvalid =
        blockTimeGteValue !== undefined && blockTimeLteValue !== undefined && blockTimeGteValue > blockTimeLteValue;
    const hasError = slotGteInvalid || slotLteInvalid || slotRangeInvalid || timeRangeInvalid;

    const apply = () => {
        if (hasError) return;
        // The hasError guard above rules out the 'invalid' sentinel for both slots.
        updateFilters({
            [BLOCK_TIME_GTE_PARAM]: blockTimeGteValue,
            [BLOCK_TIME_LTE_PARAM]: blockTimeLteValue,
            [SLOT_GTE_PARAM]: slotGteValue as number | undefined,
            [SLOT_LTE_PARAM]: slotLteValue as number | undefined,
            [STATUS_PARAM]: parseEnumParam(statusDraft, STATUS_VALUES),
        });
        setOpen(false);
    };

    const clearAll = () => {
        updateFilters({
            [BLOCK_TIME_GTE_PARAM]: undefined,
            [BLOCK_TIME_LTE_PARAM]: undefined,
            [SLOT_GTE_PARAM]: undefined,
            [SLOT_LTE_PARAM]: undefined,
            [STATUS_PARAM]: undefined,
        });
        setOpen(false);
    };

    const activeCount =
        (slot?.gte !== undefined ? 1 : 0) +
        (slot?.lte !== undefined ? 1 : 0) +
        (status !== undefined ? 1 : 0) +
        (blockTime?.gte !== undefined ? 1 : 0) +
        (blockTime?.lte !== undefined ? 1 : 0);
    const triggerLabel = activeCount === 0 ? 'Filters' : 'Edit filters';

    // The endpoint doesn't support getTransactionsForAddress, so filtering can't be
    // applied server-side; show a disabled control rather than a misleading filter UI.
    if (!supported) {
        return (
            <Button
                size="sm"
                variant="outline"
                disabled
                aria-label="Filters unavailable"
                title="Transaction filtering requires a Triton- or Helius-compatible RPC endpoint"
            >
                <Filter />
                <span className="hidden md:inline">Filters</span>
            </Button>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button size="sm" variant="outline" aria-label={triggerLabel}>
                    <Filter />
                    <span className="hidden md:inline">{triggerLabel}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-3">
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        apply();
                    }}
                    className="flex flex-col gap-3"
                >
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-neutral-300">Slot ≥</label>
                        <Input
                            autoFocus
                            variant="dark"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="lower bound (optional)"
                            value={slotGteDraft}
                            aria-invalid={slotGteInvalid || slotRangeInvalid}
                            onChange={e => setSlotGteDraft(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-neutral-300">Slot ≤</label>
                        <Input
                            variant="dark"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="upper bound (optional)"
                            value={slotLteDraft}
                            aria-invalid={slotLteInvalid || slotRangeInvalid}
                            onChange={e => setSlotLteDraft(e.target.value)}
                        />
                    </div>
                    {slotRangeInvalid && <div className="text-xs text-red-400">Slot ≥ must be ≤ slot ≤.</div>}

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-neutral-300" htmlFor="history-status-filter">
                            Status
                        </label>
                        <select
                            id="history-status-filter"
                            aria-label="Status"
                            className={SELECT_CLASS}
                            value={statusDraft}
                            onChange={e => setStatusDraft(e.target.value)}
                        >
                            <option value="">Any</option>
                            <option value="succeeded">Succeeded</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-neutral-300">Block time ≥</label>
                        <Input
                            type="datetime-local"
                            variant="dark"
                            value={blockTimeGteDraft}
                            aria-invalid={timeRangeInvalid}
                            onChange={e => setBlockTimeGteDraft(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-neutral-300">Block time ≤</label>
                        <Input
                            type="datetime-local"
                            variant="dark"
                            value={blockTimeLteDraft}
                            aria-invalid={timeRangeInvalid}
                            onChange={e => setBlockTimeLteDraft(e.target.value)}
                        />
                    </div>
                    {timeRangeInvalid && (
                        <div className="text-xs text-red-400">Block time ≥ must be on or before block time ≤.</div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
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
export function HistoryFilterBar(props: HistoryFilters) {
    return (
        <div className="d-flex align-items-center flex-wrap gap-2">
            <HistoryFilterChips {...props} />
            <HistoryFilterTrigger {...props} />
        </div>
    );
}

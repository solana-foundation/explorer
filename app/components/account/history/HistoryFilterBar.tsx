'use client';

import { Button } from '@components/shared/ui/button';
import { Input } from '@components/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@components/shared/ui/popover';
import { HistoryFilters } from '@providers/accounts/history';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { Filter, X } from 'react-feather';

export const UNTIL_SLOT_PARAM = 'untilSlot';
export const BEFORE_SLOT_PARAM = 'beforeSlot';
export const STATUS_PARAM = 'status';
export const BLOCK_TIME_FROM_PARAM = 'blockTimeFrom';
export const BLOCK_TIME_TO_PARAM = 'blockTimeTo';
export const TOKEN_ACCOUNTS_PARAM = 'tokenAccounts';

const STATUS_VALUES = ['succeeded', 'failed'] as const;
const TOKEN_ACCOUNTS_VALUES = ['all', 'balanceChanged'] as const;

const TOKEN_ACCOUNTS_LABELS: Record<(typeof TOKEN_ACCOUNTS_VALUES)[number], string> = {
    all: 'All token accounts',
    balanceChanged: 'Balance changed',
};

function parseSlotParam(raw: string | null | undefined): number | undefined {
    if (!raw) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : undefined;
}

function parseEnumParam<T extends string>(raw: string | null | undefined, allowed: readonly T[]): T | undefined {
    return raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : undefined;
}

export function useHistoryFilters(): HistoryFilters {
    const searchParams = useSearchParams();
    return {
        beforeSlot: parseSlotParam(searchParams?.get(BEFORE_SLOT_PARAM)),
        blockTimeFrom: parseSlotParam(searchParams?.get(BLOCK_TIME_FROM_PARAM)),
        blockTimeTo: parseSlotParam(searchParams?.get(BLOCK_TIME_TO_PARAM)),
        status: parseEnumParam(searchParams?.get(STATUS_PARAM), STATUS_VALUES),
        tokenAccounts: parseEnumParam(searchParams?.get(TOKEN_ACCOUNTS_PARAM), TOKEN_ACCOUNTS_VALUES),
        untilSlot: parseSlotParam(searchParams?.get(UNTIL_SLOT_PARAM)),
    };
}

const PARAM_BY_KEY: Record<keyof HistoryFilters, string> = {
    beforeSlot: BEFORE_SLOT_PARAM,
    blockTimeFrom: BLOCK_TIME_FROM_PARAM,
    blockTimeTo: BLOCK_TIME_TO_PARAM,
    status: STATUS_PARAM,
    tokenAccounts: TOKEN_ACCOUNTS_PARAM,
    untilSlot: UNTIL_SLOT_PARAM,
};

function useUpdateHistoryFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    return React.useCallback(
        (next: Partial<HistoryFilters>) => {
            const params = new URLSearchParams(searchParams?.toString() ?? '');
            (Object.keys(next) as (keyof HistoryFilters)[]).forEach(key => {
                const value = next[key];
                const param = PARAM_BY_KEY[key];
                if (value === undefined) {
                    params.delete(param);
                } else {
                    params.set(param, String(value));
                }
            });
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
        <span className="badge bg-info-soft d-inline-flex align-items-center gap-1">
            <span>
                {label}: {value}
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

export function HistoryFilterChips(filters: HistoryFilters) {
    const { untilSlot, beforeSlot, status, blockTimeFrom, blockTimeTo, tokenAccounts } = filters;
    const updateFilters = useUpdateHistoryFilters();
    const hasAny =
        untilSlot !== undefined ||
        beforeSlot !== undefined ||
        status !== undefined ||
        blockTimeFrom !== undefined ||
        blockTimeTo !== undefined ||
        tokenAccounts !== undefined;
    if (!hasAny) return null;
    return (
        <>
            {untilSlot !== undefined && (
                <FilterChip
                    label="Until slot"
                    value={untilSlot.toLocaleString()}
                    onClear={() => updateFilters({ untilSlot: undefined })}
                />
            )}
            {beforeSlot !== undefined && (
                <FilterChip
                    label="Before slot"
                    value={beforeSlot.toLocaleString()}
                    onClear={() => updateFilters({ beforeSlot: undefined })}
                />
            )}
            {status !== undefined && (
                <FilterChip
                    label="Status"
                    value={status === 'succeeded' ? 'Succeeded' : 'Failed'}
                    onClear={() => updateFilters({ status: undefined })}
                />
            )}
            {blockTimeFrom !== undefined && (
                <FilterChip
                    label="From"
                    value={new Date(blockTimeFrom * 1000).toLocaleString()}
                    onClear={() => updateFilters({ blockTimeFrom: undefined })}
                />
            )}
            {blockTimeTo !== undefined && (
                <FilterChip
                    label="To"
                    value={new Date(blockTimeTo * 1000).toLocaleString()}
                    onClear={() => updateFilters({ blockTimeTo: undefined })}
                />
            )}
            {tokenAccounts !== undefined && (
                <FilterChip
                    label="Token accounts"
                    value={TOKEN_ACCOUNTS_LABELS[tokenAccounts]}
                    onClear={() => updateFilters({ tokenAccounts: undefined })}
                />
            )}
        </>
    );
}

const SELECT_CLASS =
    'e-w-full e-rounded-md e-border e-border-neutral-700 e-bg-neutral-900 e-px-2 e-py-1.5 e-text-sm e-text-neutral-100';

export function HistoryFilterTrigger(filters: HistoryFilters) {
    const { untilSlot, beforeSlot, status, blockTimeFrom, blockTimeTo, tokenAccounts } = filters;
    const updateFilters = useUpdateHistoryFilters();
    const [open, setOpen] = React.useState(false);

    const [untilDraft, setUntilDraft] = React.useState('');
    const [beforeDraft, setBeforeDraft] = React.useState('');
    const [statusDraft, setStatusDraft] = React.useState('');
    const [fromDraft, setFromDraft] = React.useState('');
    const [toDraft, setToDraft] = React.useState('');
    const [tokenAccountsDraft, setTokenAccountsDraft] = React.useState('');

    React.useEffect(() => {
        setUntilDraft(untilSlot !== undefined ? String(untilSlot) : '');
        setBeforeDraft(beforeSlot !== undefined ? String(beforeSlot) : '');
        setStatusDraft(status ?? '');
        setFromDraft(unixToLocalInput(blockTimeFrom));
        setToDraft(unixToLocalInput(blockTimeTo));
        setTokenAccountsDraft(tokenAccounts ?? '');
    }, [untilSlot, beforeSlot, status, blockTimeFrom, blockTimeTo, tokenAccounts, open]);

    const untilValue = slotDraftToValue(untilDraft);
    const beforeValue = slotDraftToValue(beforeDraft);
    const fromValue = localInputToUnix(fromDraft);
    const toValue = localInputToUnix(toDraft);

    const untilInvalid = untilValue === 'invalid';
    const beforeInvalid = beforeValue === 'invalid';
    const slotRangeInvalid =
        typeof untilValue === 'number' && typeof beforeValue === 'number' && untilValue > beforeValue;
    const timeRangeInvalid = fromValue !== undefined && toValue !== undefined && fromValue > toValue;
    const hasError = untilInvalid || beforeInvalid || slotRangeInvalid || timeRangeInvalid;

    const apply = () => {
        if (hasError) return;
        // The hasError guard above rules out the 'invalid' sentinel for both slots.
        updateFilters({
            beforeSlot: beforeValue as number | undefined,
            blockTimeFrom: fromValue,
            blockTimeTo: toValue,
            status: parseEnumParam(statusDraft, STATUS_VALUES),
            tokenAccounts: parseEnumParam(tokenAccountsDraft, TOKEN_ACCOUNTS_VALUES),
            untilSlot: untilValue as number | undefined,
        });
        setOpen(false);
    };

    const clearAll = () => {
        updateFilters({
            beforeSlot: undefined,
            blockTimeFrom: undefined,
            blockTimeTo: undefined,
            status: undefined,
            tokenAccounts: undefined,
            untilSlot: undefined,
        });
        setOpen(false);
    };

    const activeCount =
        (untilSlot !== undefined ? 1 : 0) +
        (beforeSlot !== undefined ? 1 : 0) +
        (status !== undefined ? 1 : 0) +
        (blockTimeFrom !== undefined ? 1 : 0) +
        (blockTimeTo !== undefined ? 1 : 0) +
        (tokenAccounts !== undefined ? 1 : 0);
    const triggerLabel = activeCount === 0 ? 'Filters' : 'Edit filters';

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button size="sm" variant="outline" aria-label={triggerLabel}>
                    <Filter />
                    <span className="e-hidden md:e-inline">{triggerLabel}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="e-p-3 e-w-80">
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        apply();
                    }}
                    className="e-flex e-flex-col e-gap-3"
                >
                    <div className="e-flex e-flex-col e-gap-1">
                        <label className="e-text-xs e-text-neutral-300">Until slot</label>
                        <Input
                            autoFocus
                            variant="dark"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="lower bound (optional)"
                            value={untilDraft}
                            aria-invalid={untilInvalid || slotRangeInvalid}
                            onChange={e => setUntilDraft(e.target.value)}
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
                            aria-invalid={beforeInvalid || slotRangeInvalid}
                            onChange={e => setBeforeDraft(e.target.value)}
                        />
                    </div>
                    {slotRangeInvalid && (
                        <div className="e-text-xs e-text-red-400">Until slot must be ≤ before slot.</div>
                    )}

                    <div className="e-flex e-flex-col e-gap-1">
                        <label className="e-text-xs e-text-neutral-300" htmlFor="history-status-filter">
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

                    <div className="e-flex e-flex-col e-gap-1">
                        <label className="e-text-xs e-text-neutral-300">From (block time)</label>
                        <Input
                            type="datetime-local"
                            variant="dark"
                            value={fromDraft}
                            aria-invalid={timeRangeInvalid}
                            onChange={e => setFromDraft(e.target.value)}
                        />
                    </div>
                    <div className="e-flex e-flex-col e-gap-1">
                        <label className="e-text-xs e-text-neutral-300">To (block time)</label>
                        <Input
                            type="datetime-local"
                            variant="dark"
                            value={toDraft}
                            aria-invalid={timeRangeInvalid}
                            onChange={e => setToDraft(e.target.value)}
                        />
                    </div>
                    {timeRangeInvalid && (
                        <div className="e-text-xs e-text-red-400">From must be on or before To.</div>
                    )}

                    <div className="e-flex e-flex-col e-gap-1">
                        <label className="e-text-xs e-text-neutral-300" htmlFor="history-token-accounts-filter">
                            Token accounts
                        </label>
                        <select
                            id="history-token-accounts-filter"
                            aria-label="Token accounts"
                            className={SELECT_CLASS}
                            value={tokenAccountsDraft}
                            onChange={e => setTokenAccountsDraft(e.target.value)}
                        >
                            <option value="">None (direct activity)</option>
                            <option value="all">All token accounts</option>
                            <option value="balanceChanged">Balance changed</option>
                        </select>
                    </div>

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
export function HistoryFilterBar(props: HistoryFilters) {
    return (
        <div className="d-flex align-items-center gap-2 flex-wrap">
            <HistoryFilterChips {...props} />
            <HistoryFilterTrigger {...props} />
        </div>
    );
}

'use client';

import { Button } from '@components/shared/ui/button';
import { Input } from '@components/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@components/shared/ui/popover';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { Filter, X } from 'react-feather';

export const AFTER_SLOT_PARAM = 'afterSlot';

export function useAfterSlotParam(): number | undefined {
    const searchParams = useSearchParams();
    const raw = searchParams?.get(AFTER_SLOT_PARAM);
    if (!raw) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : undefined;
}

function useUpdateAfterSlot() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    return React.useCallback(
        (next: number | undefined) => {
            const params = new URLSearchParams(searchParams?.toString() ?? '');
            if (next === undefined) {
                params.delete(AFTER_SLOT_PARAM);
            } else {
                params.set(AFTER_SLOT_PARAM, String(next));
            }
            const qs = params.toString();
            router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
        },
        [router, pathname, searchParams],
    );
}

export function HistoryFilterBar({ afterSlot }: { afterSlot: number | undefined }) {
    const updateAfterSlot = useUpdateAfterSlot();
    const [open, setOpen] = React.useState(false);
    const [draft, setDraft] = React.useState<string>(afterSlot !== undefined ? String(afterSlot) : '');

    React.useEffect(() => {
        setDraft(afterSlot !== undefined ? String(afterSlot) : '');
    }, [afterSlot]);

    const apply = () => {
        const trimmed = draft.trim();
        if (!trimmed) {
            updateAfterSlot(undefined);
        } else {
            const parsed = Number(trimmed);
            if (Number.isFinite(parsed) && parsed >= 0) {
                updateAfterSlot(Math.floor(parsed));
            }
        }
        setOpen(false);
    };

    const clear = () => updateAfterSlot(undefined);

    return (
        <div className="d-flex align-items-center gap-2">
            {afterSlot !== undefined && (
                <span className="badge bg-info-soft d-inline-flex align-items-center gap-1">
                    <span>After slot: {afterSlot.toLocaleString()}</span>
                    <button
                        type="button"
                        onClick={clear}
                        aria-label="Clear after slot filter"
                        className="btn btn-link btn-sm p-0 text-muted d-inline-flex align-items-center"
                        style={{ lineHeight: 0 }}
                    >
                        <X size={12} />
                    </button>
                </span>
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button size="sm" variant="outline">
                        <Filter />
                        {afterSlot === undefined ? 'Filter' : 'Edit filter'}
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="e-p-3 e-w-64">
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            apply();
                        }}
                        className="e-flex e-flex-col e-gap-2"
                    >
                        <label className="e-text-xs e-text-neutral-300">After slot</label>
                        <Input
                            autoFocus
                            variant="dark"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="e.g. 310000000"
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                        />
                        <div className="e-flex e-justify-end e-gap-2 e-pt-1">
                            {afterSlot !== undefined && (
                                <Button type="button" size="sm" variant="ghost" onClick={clear}>
                                    Clear
                                </Button>
                            )}
                            <Button type="submit" size="sm" variant="accent">
                                Apply
                            </Button>
                        </div>
                    </form>
                </PopoverContent>
            </Popover>
        </div>
    );
}

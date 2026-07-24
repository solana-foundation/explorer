'use client';

import { format, isValid } from 'date-fns';
import * as React from 'react';
import { type ChevronProps, type DayButtonProps, DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'react-feather';

import { cn } from '@/app/components/shared/utils';

// value: ISO datetime-local string "YYYY-MM-DDTHH:mm" or ""
interface DateTimePickerProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    'aria-invalid'?: boolean;
}

function parseLocalIso(value: string): Date | undefined {
    if (!value.includes('T')) return undefined;
    const [datePart, timePart = '00:00'] = value.split('T');
    if (!datePart) return undefined;
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    if (!year || !month || !day) return undefined;
    const date = new Date(year, month - 1, day, hours ?? 0, minutes ?? 0);
    return isValid(date) ? date : undefined;
}

interface TimeSegmentProps {
    value: number;
    max: number;
    label: string;
    onChange: (v: number) => void;
    onAdvance?: () => void;
}

const TimeSegment = React.forwardRef<HTMLInputElement, TimeSegmentProps>(function TimeSegment(
    { value, max, label, onChange, onAdvance },
    ref,
) {
    const [typing, setTyping] = React.useState('');
    const timerRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    React.useEffect(() => () => clearTimeout(timerRef.current), []);

    const wrap = (n: number) => ((n % (max + 1)) + (max + 1)) % (max + 1);

    const commit = (raw: string, advance: boolean) => {
        const num = parseInt(raw, 10);
        if (!isNaN(num)) onChange(Math.min(num, max));
        setTyping('');
        if (advance) onAdvance?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            clearTimeout(timerRef.current);
            setTyping('');
            onChange(wrap(value + 1));
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            clearTimeout(timerRef.current);
            setTyping('');
            onChange(wrap(value - 1));
        } else if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            const next = typing + e.key;
            const num = parseInt(next, 10);
            const maxFirstDigit = Math.floor(max / 10);
            clearTimeout(timerRef.current);
            if (next.length === 1 && num <= maxFirstDigit) {
                // Could be a 2-digit number — wait briefly for the second digit
                setTyping(next);
                timerRef.current = setTimeout(() => commit(next, true), 1000);
            } else {
                commit(next, true);
            }
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        onChange(wrap(value + (e.deltaY < 0 ? 1 : -1)));
    };

    return (
        <input
            ref={ref}
            type="text"
            readOnly
            role="spinbutton"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={label}
            value={typing || String(value).padStart(2, '0')}
            onChange={() => {}}
            onKeyDown={handleKeyDown}
            onWheel={handleWheel}
            className={cn(
                'h-7 w-8 cursor-default select-none rounded border text-center',
                'border-outer-space-950 bg-heavy-metal-900',
                'font-mono text-xs text-neutral-200',
                'outline-none focus:ring-1 focus:ring-accent',
                typing && 'ring-accent/50 ring-1',
            )}
        />
    );
});

export function DateTimePicker({
    value,
    onChange,
    placeholder = 'Pick a date',
    'aria-invalid': ariaInvalid,
}: DateTimePickerProps) {
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const minuteRef = React.useRef<HTMLInputElement>(null);

    const selected = parseLocalIso(value);
    const timePart = value.includes('T') ? (value.split('T')[1] ?? '00:00') : '00:00';
    const [hStr = '00', mStr = '00'] = timePart.split(':') as [string, string];
    const hour = parseInt(hStr, 10);
    const minute = parseInt(mStr, 10);

    React.useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const displayValue = selected ? `${format(selected, 'MMM d, yyyy')} ${hStr}:${mStr}` : '';
    const datePart = value.split('T')[0] || format(new Date(), 'yyyy-MM-dd');

    const handleDaySelect = (day: Date | undefined) => {
        if (!day) {
            onChange('');
            return;
        }
        onChange(`${format(day, 'yyyy-MM-dd')}T${timePart}`);
    };

    const handleHourChange = (h: number) => onChange(`${datePart}T${String(h).padStart(2, '0')}:${mStr}`);

    const handleMinuteChange = (m: number) => onChange(`${datePart}T${hStr}:${String(m).padStart(2, '0')}`);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
                className={cn(
                    'flex h-9 w-full items-center rounded border border-solid px-4 font-mono text-xs',
                    'border-outer-space-950 bg-heavy-metal-900',
                    'outline-none transition-colors',
                    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900',
                    displayValue ? 'text-neutral-200' : 'text-neutral-400',
                    open && 'ring-2 ring-accent ring-offset-2 ring-offset-neutral-900',
                    ariaInvalid && 'border-destructive',
                )}
            >
                {displayValue || placeholder}
            </button>
            {open && (
                <div className="absolute left-0 top-full z-50 mt-1 min-w-max rounded-md border border-outer-space-800 bg-outer-space-900 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                    <DayPicker
                        mode="single"
                        selected={selected}
                        defaultMonth={selected}
                        onSelect={handleDaySelect}
                        classNames={DAY_PICKER_CLASS_NAMES}
                        components={{ Chevron: PickerChevron, DayButton: PickerDayButton }}
                    />
                    <div className="relative z-[999] flex items-center gap-2 border-t border-outer-space-800 px-4 py-3">
                        <span className="w-8 text-xs text-neutral-400">Time</span>
                        <TimeSegment
                            value={hour}
                            max={23}
                            label="Hour"
                            onChange={handleHourChange}
                            onAdvance={() => minuteRef.current?.focus()}
                        />
                        <span className="text-neutral-500">:</span>
                        <TimeSegment
                            ref={minuteRef}
                            value={minute}
                            max={59}
                            label="Minute"
                            onChange={handleMinuteChange}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function PickerChevron({ orientation }: ChevronProps) {
    return orientation === 'left' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />;
}

function PickerDayButton({ day: _day, modifiers, className: _className, ...props }: DayButtonProps) {
    const ref = React.useRef<HTMLButtonElement>(null);
    React.useEffect(() => {
        if (modifiers.focused) ref.current?.focus();
    }, [modifiers.focused]);

    return (
        <button
            ref={ref}
            {...props}
            className={cn(
                'flex h-8 w-8 cursor-pointer items-center justify-center rounded border-none text-xs',
                'outline-none focus-visible:ring-1 focus-visible:ring-neutral-400',
                'disabled:pointer-events-none disabled:opacity-30',
                modifiers.selected
                    ? 'hover:bg-accent/90 bg-accent text-gray-900'
                    : modifiers.outside
                      ? 'bg-transparent text-neutral-600 opacity-50 hover:bg-outer-space-800'
                      : modifiers.today
                        ? 'bg-transparent text-accent hover:bg-outer-space-800'
                        : 'bg-transparent text-neutral-200 hover:bg-outer-space-800',
            )}
        />
    );
}

const NAV_BUTTON_CLASS = cn(
    'flex h-7 w-7 cursor-pointer items-center justify-center rounded border-none bg-transparent text-neutral-400',
    'hover:bg-outer-space-800 hover:text-neutral-200',
    'outline-none focus-visible:ring-1 focus-visible:ring-neutral-400',
    'disabled:pointer-events-none disabled:opacity-30',
);

const DAY_PICKER_CLASS_NAMES = {
    button_next: NAV_BUTTON_CLASS,
    button_previous: NAV_BUTTON_CLASS,
    caption_after_enter: '',
    caption_after_exit: '',
    caption_before_enter: '',
    caption_before_exit: '',
    caption_label: 'text-sm font-medium text-neutral-200',
    chevron: '',
    day: 'relative flex h-9 w-9 items-center justify-center p-0',
    day_button: '',
    disabled: '',
    dropdown: '',
    dropdown_root: '',
    dropdowns: '',
    focused: '',
    footer: '',
    hidden: 'invisible',
    month: 'flex flex-col gap-2',
    month_caption: 'relative flex items-center justify-center pb-2',
    month_grid: 'w-full border-collapse',
    months: 'flex gap-4',
    months_dropdown: '',
    nav: 'absolute inset-0 flex items-center justify-between',
    outside: '',
    range_end: '',
    range_middle: '',
    range_start: '',
    root: 'p-4',
    selected: '',
    today: '',
    week: 'flex',
    week_number: '',
    week_number_header: '',
    weekday: 'w-9 text-center text-[0.7rem] font-normal text-neutral-500',
    weekdays: 'flex',
    weeks: 'mt-1',
    weeks_after_enter: '',
    weeks_after_exit: '',
    weeks_before_enter: '',
    weeks_before_exit: '',
    years_dropdown: '',
};

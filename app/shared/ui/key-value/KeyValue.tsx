import React from 'react';

import { cn } from '@/app/components/shared/utils';

import { Icon } from './Icon';
import { Label } from './Label';
import type { LabelSize, LineBox } from './tokens';

/**
 * One key-value row: label on the left, value on the right. Stacks on mobile; from `sm`
 * up it's a flex row with `items-baseline` so the value's baseline lines up with the
 * label's — and the label's own line-box shim (see Label) standardizes the row's text height.
 *
 * `label` is wrapped in a `Label` so every key gets the same typography + baseline box,
 * including component labels (links/tooltips), which inherit the size and add their own color.
 * An optional leading `icon` is wrapped in `Icon` (the Label counterpart) and placed before the
 * label; because both share `labelSize`/`lineBox` they land on the same grid with no per-row
 * nudging. An optional `trailingIcon` (e.g. a help/question glyph) is instead rendered *inline*
 * at the end of the label text, so it sits after the last word and wraps with it rather than
 * floating after the whole text block.
 *
 * The label column width is a prop (`labelWidth`, a Tailwind width class) so a set of rows can
 * share one width and keep their values aligned — pass the same class to each row (the default
 * `sm:w-56` already gives every row an equal-length label column).
 */
export function KeyValue({
    label,
    icon,
    trailingIcon,
    labelSize = 'm',
    lineBox = 24,
    labelWidth = 'sm:w-56',
    align = 'start',
    row = false,
    className,
    valueClassName,
    children,
}: {
    label: React.ReactNode;
    icon?: React.ReactNode;
    /** Icon rendered inline after the last word of the label (e.g. a help/question glyph). */
    trailingIcon?: React.ReactNode;
    labelSize?: LabelSize;
    lineBox?: LineBox;
    /** Tailwind width class(es) for the label column; keep it the same across rows for equal-length labels. */
    labelWidth?: string;
    /** Horizontal alignment of the value column from `sm` up. Defaults to `start` (left). */
    align?: 'start' | 'end';
    /**
     * Force the horizontal label/value row at every width instead of stacking below `sm`.
     * Pass an unprefixed `labelWidth` (e.g. `w-56`) alongside so the label column keeps its
     * width on mobile too.
     */
    row?: boolean;
    className?: string;
    /** Extra classes for the value column (e.g. custom flex/gap for composite values). */
    valueClassName?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                'flex border-0 border-b border-solid border-dark-border px-3 py-2 last:border-b-0',
                row ? 'flex-row items-baseline gap-dk-4' : 'flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-dk-4',
                className,
            )}
        >
            {/* items-start: Icon and Label are both `lineBox`-tall boxes that internally drop their
                content onto the shared grid, so aligning their tops aligns their contents. */}
            {/* min-w-0: without it this flex item's automatic minimum size is the label's
                min-content, so a long single-word key (e.g. "Acknowledgements") grows the column
                past `labelWidth` to stay on one line instead of wrapping. */}
            <div className={cn('flex min-w-0 items-start gap-1.5', row ? 'flex-none' : 'sm:flex-none', labelWidth)}>
                {icon != undefined && (
                    <Icon size={labelSize} lineBox={lineBox}>
                        {icon}
                    </Icon>
                )}
                <Label size={labelSize} lineBox={lineBox}>
                    {trailingIcon == undefined
                        ? label
                        : withTrailingIcon(
                              label,
                              <Icon inline size={labelSize} className="ml-1.5">
                                  {trailingIcon}
                              </Icon>,
                          )}
                </Label>
            </div>
            <div
                className={cn(
                    // overflow-wrap:anywhere (not break-word) so a long unbroken value — a base58
                    // address/hash with no break points — wraps inside the column instead of
                    // running past the block edge: `anywhere` also lets the flex column shrink
                    // below the token's width (break-word leaves min-content = the whole token).
                    'flex min-w-0 flex-1 text-sm [overflow-wrap:anywhere]',
                    align === 'end' && (row ? 'justify-end' : 'sm:justify-end'),
                    valueClassName,
                )}
            >
                {children}
            </div>
        </div>
    );
}

/**
 * Render `label` followed by a trailing `icon` so the icon rides the label's *last word* and
 * wraps with it. An inline SVG is an atomic inline, so the browser may break the line right
 * before it (dropping the icon onto its own line); keeping the last word + icon in one
 * `white-space: nowrap` run is the only reliable way to forbid that break. Earlier words still
 * wrap on their spaces. Only possible when `label` is a string; a node label just gets the icon
 * appended (it can't be split into words).
 */
function withTrailingIcon(label: React.ReactNode, icon: React.ReactNode): React.ReactNode {
    if (typeof label !== 'string') {
        return (
            <>
                {label}
                {icon}
            </>
        );
    }
    // eslint-disable-next-line no-restricted-syntax -- concise trailing-whitespace trim before locating the label's last word
    const trimmed = label.replace(/\s+$/, '');
    const cut = trimmed.lastIndexOf(' ');
    if (cut === -1) {
        return (
            <span style={{ whiteSpace: 'nowrap' }}>
                {trimmed}
                {icon}
            </span>
        );
    }
    return (
        <>
            {trimmed.slice(0, cut)}{' '}
            <span style={{ whiteSpace: 'nowrap' }}>
                {trimmed.slice(cut + 1)}
                {icon}
            </span>
        </>
    );
}

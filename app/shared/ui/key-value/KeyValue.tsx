import React from 'react';

import { cn } from '@/app/components/shared/utils';

import { Icon } from './Icon';
import { Label } from './Label';
import type { LabelSize, LineBox } from './tokens';

export function KeyValue({
    label,
    icon,
    trailingIcon,
    trailing,
    labelSize = 'm',
    lineBox,
    labelWidth = 'sm:w-56',
    align = 'start',
    row = false,
    density = 'comfortable',
    divider = true,
    className,
    valueClassName,
    children,
}: {
    label: React.ReactNode;
    icon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
    trailing?: React.ReactNode;
    labelSize?: LabelSize;
    lineBox?: LineBox;
    labelWidth?: string;
    align?: 'start' | 'end';
    row?: boolean;
    density?: 'comfortable' | 'compact';
    divider?: boolean;
    className?: string;
    valueClassName?: string;
    children: React.ReactNode;
}) {
    const compact = density === 'compact';
    const resolvedLineBox: LineBox = lineBox ?? (compact ? 20 : 24);
    return (
        <div
            className={cn(
                'flex border-0 border-solid border-dark-border',
                divider && 'border-b last:border-b-0',
                compact ? 'py-2' : 'px-3 py-2',
                row
                    ? cn('flex-row items-baseline', compact ? 'gap-3' : 'gap-dk-4')
                    : 'flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-dk-4',
                className,
            )}
        >
            <div className={cn('flex min-w-0 items-start gap-1.5', row ? 'flex-none' : 'sm:flex-none', labelWidth)}>
                {icon != undefined && (
                    <Icon size={labelSize} lineBox={resolvedLineBox}>
                        {icon}
                    </Icon>
                )}
                <Label size={labelSize} lineBox={resolvedLineBox}>
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
                    'flex min-w-0 flex-1 text-sm [overflow-wrap:anywhere]',
                    align === 'end' && (row ? 'justify-end' : 'sm:justify-end'),
                    valueClassName,
                )}
            >
                {children}
            </div>
            {trailing}
        </div>
    );
}

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

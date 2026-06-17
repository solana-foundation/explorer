// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
'use client';

import type { Address } from '@solana/kit';
import Link from 'next/link';
import React from 'react';
import { Check, Copy, XCircle } from 'react-feather';

import { cn } from '@/app/components/shared/utils';
import { useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';
import { useClusterPath } from '@/app/utils/url';

type Truncate = { head: number; tail: number };

type Props = {
    address: Address;
    /** Replace the middle of the address with an ellipsis, keeping `head`/`tail` chars on each side. */
    truncate?: Truncate;
    className?: string;
    'aria-label'?: string;
};

export function AddressLink({ address, truncate, className, 'aria-label': ariaLabel }: Props) {
    const href = useClusterPath({ pathname: `/address/${address}` });
    const displayText = truncate ? abbreviateAddress(address, truncate) : address;

    return (
        <span className={cn('inline-flex items-center gap-1.5 font-mono text-dk-sm', className)}>
            <CopyButton text={address} />
            <Link
                href={href}
                className="text-dk-primary-dark hover:text-dark-accent"
                aria-label={ariaLabel ?? `Open address ${address}`}
                title={truncate ? address : undefined}
            >
                {displayText}
            </Link>
        </span>
    );
}

function abbreviateAddress(address: string, { head, tail }: Truncate): string {
    if (address.length <= head + tail + 1) return address;
    return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

function CopyButton({ text }: { text: string }) {
    const [state, copy] = useCopyToClipboard();
    const Icon = state === 'copied' ? Check : state === 'errored' ? XCircle : Copy;

    return (
        <button
            type="button"
            onClick={() => copy(text)}
            className={cn(
                'inline-flex h-5 w-5 shrink-0 items-center justify-center',
                'rounded border-0 bg-transparent p-0 leading-none',
                'text-dark-muted-foreground hover:text-dk-white',
                state === 'copied' && 'text-dark-accent',
                state === 'errored' && 'text-destructive',
            )}
            aria-label={state === 'copied' ? 'Copied' : 'Copy address'}
        >
            <Icon size={14} />
        </button>
    );
}

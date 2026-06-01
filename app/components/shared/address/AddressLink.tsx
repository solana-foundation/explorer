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
        <span className={cn('e-inline-flex e-items-center e-gap-1.5 e-font-mono e-text-dk-sm', className)}>
            <CopyButton text={address} />
            <Link
                href={href}
                className="e-text-dk-primary-dark hover:e-text-dk-primary-on-dark"
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
                'e-inline-flex e-h-5 e-w-5 e-shrink-0 e-items-center e-justify-center',
                'e-rounded e-border-0 e-bg-transparent e-p-0 e-leading-none',
                'e-text-dk-gray-700 hover:e-text-dk-white',
                state === 'copied' && 'e-text-dk-primary-on-dark',
                state === 'errored' && 'e-text-dk-warning-on-dark',
            )}
            aria-label={state === 'copied' ? 'Copied' : 'Copy address'}
        >
            <Icon size={14} />
        </button>
    );
}

'use client';

import { Address } from '@components/common/Address';
import { cn } from '@components/shared/utils';
import { PublicKey } from '@solana/web3.js';
import React from 'react';

export const FlatContext = React.createContext(false);

type DetailRowProps = {
    children: React.ReactNode;
    className?: string;
    label: string;
};

export function DetailRow({ children, className, label }: DetailRowProps) {
    const flat = React.useContext(FlatContext);
    return (
        <div
            className={cn(
                'e-grid e-grid-cols-[clamp(100px,25%,200px)_1fr] e-items-baseline e-gap-2 e-py-1.5',
                flat ? 'e-px-4' : 'e-pr-3 md:e-pr-4',
                className,
            )}
        >
            <div className="e-text-sm e-text-outer-space-300">{label}</div>
            <div className="e-text-sm">{children}</div>
        </div>
    );
}

export function AddressRow({ label, value }: { label: string; value: PublicKey | string | undefined }) {
    if (!value) return undefined;
    const pubkey = typeof value === 'string' ? new PublicKey(value) : value;
    return (
        <DetailRow label={label}>
            <Address pubkey={pubkey} link />
        </DetailRow>
    );
}

'use client';

import { Address } from '@components/common/Address';
import { cn } from '@components/shared/utils';
import { PublicKey } from '@solana/web3.js';
import React from 'react';

import { KeyValue } from '@/app/shared/ui/key-value';

// `flat` (the drawer layout) adds the horizontal gutter the inline table row gets from its grid.
export const FlatContext = React.createContext(false);

type DetailRowProps = {
    children: React.ReactNode;
    className?: string;
    label: string;
};

export function DetailRow({ children, className, label }: DetailRowProps) {
    const flat = React.useContext(FlatContext);
    return (
        <KeyValue label={label} density="flat" divider={false} className={cn(flat && 'px-4', className)}>
            {children}
        </KeyValue>
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

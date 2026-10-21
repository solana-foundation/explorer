import { Address } from '@components/common/Address';
import { InfoTooltip } from '@components/common/InfoTooltip';
import { TruncatedValue } from '@components/shared/TruncatedValue';
import { PMP_POINTER_HASH_NOTES, PMP_UNRESOLVED_SOURCE_HASH_NOTE } from '@entities/pmp-account';
import { PublicKey } from '@solana/web3.js';
import { DataSource } from '@solana-program/program-metadata';
import { camelToTitleCase } from '@utils/index';
import React from 'react';
import { Loader } from 'react-feather';

import { cn } from '@/app/components/shared/utils';
import { Alert } from '@/app/shared/ui/Alert';
import { KeyValue } from '@/app/shared/ui/key-value';
import { OverviewCard } from '@/app/shared/ui/OverviewCard';
import { ROW_PADDING } from '@/app/shared/ui/spacing';

import type { FieldDescriptor, FieldType } from '../lib/pmp-field-descriptors';

export const PMP_CARD_TITLE = 'Program Metadata';

const HASH_MID_TRUNCATE_CHARS = 8;

export function BasePmpAccountDataCard({ children, title }: { children: React.ReactNode; title: string }) {
    return <OverviewCard title={title}>{children}</OverviewCard>;
}

const ROW_DIVIDER = 'border-0 border-b border-solid border-outer-space-850 last:border-b-0';

export function FullWidthRow({
    children,
    className,
    ...props
}: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('min-w-0', ROW_DIVIDER, ROW_PADDING, className)} {...props}>
            {children}
        </div>
    );
}

export function DataRow({
    label,
    children,
    ...props
}: { label: React.ReactNode; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <KeyValue label={label} {...props}>
            {children}
        </KeyValue>
    );
}

/**
 * Renders a descriptor list as label/value rows.
 */
export function FieldRows<TData>({
    descriptors,
    accountData,
}: {
    descriptors: FieldDescriptor<TData>[];
    accountData: TData;
}) {
    return (
        <>
            {descriptors.map(descriptor => {
                const value = descriptor.value(accountData);

                // The ONE presence signal. `null` is not absence in this sense - it still renders, as "None".
                if (value === undefined) return undefined;

                return (
                    <DataRow
                        data-testid={`pmp-account-${descriptor.field}`}
                        key={descriptor.field}
                        label={camelToTitleCase(descriptor.field)}
                    >
                        {value === null ? 'None' : <FieldValue type={descriptor.type} value={value} />}
                    </DataRow>
                );
            })}
        </>
    );
}

export function FieldValue({ type, value }: { type: FieldType; value: boolean | string }): React.ReactNode {
    if (type === 'pubkey') return <Address pubkey={new PublicKey(String(value))} link raw />;
    if (type === 'bool') return value ? 'Yes' : 'No';
    return String(value);
}

export function PayloadHashRow({ dataSource, hash }: { dataSource?: DataSource; hash: string }) {
    const pointerNote =
        dataSource === undefined || dataSource === DataSource.Direct ? undefined : PMP_POINTER_HASH_NOTES[dataSource];

    const label =
        dataSource === undefined ? (
            <>
                <InfoTooltip text={PMP_UNRESOLVED_SOURCE_HASH_NOTE}>
                    <span data-testid="pmp-payload-data-hash-unresolved-source">Data Hash</span>
                </InfoTooltip>
                <span className="sr-only">{PMP_UNRESOLVED_SOURCE_HASH_NOTE}</span>
            </>
        ) : (
            'Data Hash'
        );

    return (
        <DataRow data-testid="pmp-payload-data-hash" label={label}>
            {pointerNote !== undefined ? (
                <span data-testid="pmp-payload-data-hash-pointer" className="text-xs text-neutral-500">
                    {pointerNote}
                </span>
            ) : (
                <TruncatedValue
                    value={hash}
                    truncation={{ enabled: true, midTruncateChars: HASH_MID_TRUNCATE_CHARS }}
                />
            )}
        </DataRow>
    );
}

export function NoteRow({
    children,
    testId,
    variant,
}: {
    children: React.ReactNode;
    testId: string;
    variant: 'default' | 'warning';
}) {
    return (
        <FullWidthRow className="whitespace-normal">
            <Alert variant={variant} data-testid={testId} className="!mb-0">
                {children}
            </Alert>
        </FullWidthRow>
    );
}

export function InfoRow({ children, testId }: { children: React.ReactNode; testId: string }) {
    return (
        <FullWidthRow className="whitespace-normal" data-testid={testId}>
            <Info>{children}</Info>
        </FullWidthRow>
    );
}

export function PendingRow({ children, testId }: { children: React.ReactNode; testId: string }) {
    return (
        <FullWidthRow>
            <span data-testid={testId} className="flex items-center gap-2 text-xs text-neutral-500">
                <Loader size={12} className="animate-spin" />
                {children}
            </span>
        </FullWidthRow>
    );
}

export function Info({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-start gap-1.5 overflow-hidden text-xs tracking-tight text-neutral-400',
                className,
            )}
        >
            {children}
        </div>
    );
}

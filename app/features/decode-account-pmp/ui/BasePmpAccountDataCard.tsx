import { Address } from '@components/common/Address';
import { PublicKey } from '@solana/web3.js';
import { camelToTitleCase } from '@utils/index';
import React from 'react';
import { Loader } from 'react-feather';

import { cn } from '@/app/components/shared/utils';
import { Alert } from '@/app/shared/ui/Alert';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

import type { FieldDescriptor, FieldType } from '../lib/pmp-field-descriptors';

export const CARD_TABLE_COLUMNS = 2;
export const PMP_CARD_TITLE = 'Program Metadata';

export function BasePmpAccountDataCard({ children, title }: { children: React.ReactNode; title: string }) {
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    {title}
                </CardTitle>
            </CardHeader>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Body>{children}</BaseTable.Body>
            </BaseTable>
        </Card>
    );
}

/**
 * Renders a descriptor list.
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
                    <BaseTable.Row data-testid={`pmp-account-${descriptor.field}`} key={descriptor.field}>
                        <BaseTable.Cell>{camelToTitleCase(descriptor.field)}</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            {value === null ? 'None' : <FieldValue type={descriptor.type} value={value} />}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                );
            })}
        </>
    );
}

export function FieldValue({ type, value }: { type: FieldType; value: boolean | string }): React.ReactNode {
    if (type === 'pubkey') return <Address pubkey={new PublicKey(String(value))} alignRight link raw />;
    if (type === 'bool') return value ? 'Yes' : 'No';
    return String(value);
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
        <BaseTable.Row>
            <BaseTable.Cell className="whitespace-normal" colSpan={CARD_TABLE_COLUMNS}>
                <Alert variant={variant} data-testid={testId} className="!mb-0">
                    {children}
                </Alert>
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

export function InfoRow({ children, testId }: { children: React.ReactNode; testId: string }) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell className="whitespace-normal" colSpan={CARD_TABLE_COLUMNS} data-testid={testId}>
                <Info>{children}</Info>
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

export function PendingRow({ children, testId }: { children: React.ReactNode; testId: string }) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell colSpan={CARD_TABLE_COLUMNS}>
                <span data-testid={testId} className="flex items-center gap-2 text-xs text-neutral-500">
                    <Loader size={12} className="animate-spin" />
                    {children}
                </span>
            </BaseTable.Cell>
        </BaseTable.Row>
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

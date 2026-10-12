'use client';

import { Copyable } from '@components/common/Copyable';
import { SolBalance } from '@components/common/SolBalance';
import { cn } from '@components/shared/utils';
import { displayTimestampUtc, unixTimestampToMs } from '@utils/date';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import type { FieldValue } from '../model/fields';
import { InstructionAddress } from './InstructionAddress';

export function ValueCell({ value }: { value: FieldValue }) {
    return (
        <BaseTable.Cell className={cn('text-right', CELL_CLASS[value.kind])}>
            <Value value={value} />
        </BaseTable.Cell>
    );
}

const CELL_CLASS: Record<FieldValue['kind'], string | undefined> = {
    address: undefined,
    bytes: undefined,
    custom: undefined,
    preformatted: undefined,
    sol: undefined,
    string: undefined,
    text: undefined,
    timestamp: 'font-mono',
};

function Value({ value }: { value: FieldValue }): React.ReactElement {
    switch (value.kind) {
        case 'address':
            return <InstructionAddress address={value.address} />;
        case 'sol':
            return <SolBalance lamports={value.lamports} />;
        case 'bytes':
            return <>{`${value.size} byte(s)`}</>;
        case 'string':
            return (
                <Copyable text={value.value}>
                    <code className="whitespace-normal break-all">{value.value}</code>
                </Copyable>
            );
        case 'text':
            return <>{value.value}</>;
        case 'timestamp':
            return <>{displayTimestampUtc(unixTimestampToMs(value.unixSeconds))}</>;
        case 'preformatted':
            return <pre className="mb-0 inline-block text-left">{joinLines(value.value)}</pre>;
        case 'custom':
            return value.value;
    }
}

function joinLines(value: string | ReadonlyArray<string | number>): string {
    return typeof value === 'string' ? value : value.join('\n');
}

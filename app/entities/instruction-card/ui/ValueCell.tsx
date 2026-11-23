'use client';

import { Copyable } from '@components/common/Copyable';
import { Epoch } from '@components/common/Epoch';
import { SolarizedJsonViewer } from '@components/common/JsonViewer';
import { Slot } from '@components/common/Slot';
import { SolBalance } from '@components/common/SolBalance';
import React from 'react';

import { Timestamp } from '@/app/components/shared/ui/timestamp';
import { BaseTable } from '@/app/shared/ui/Table';

import type { FieldValue } from '../model/fields';
import { InstructionAddress } from './InstructionAddress';

export function ValueCell({ value, colSpan }: { value: FieldValue; colSpan?: number }) {
    return (
        <BaseTable.Cell colSpan={colSpan}>
            <Value value={value} />
        </BaseTable.Cell>
    );
}

function Value({ value }: { value: FieldValue }): React.ReactElement {
    switch (value.kind) {
        case 'address':
            return <InstructionAddress address={value.address} tokenLabel={value.tokenLabel} />;
        case 'addresses':
            return (
                <>
                    {/* The key is the position because a list may hold the same address twice. */}
                    {value.addresses.map((address, i) => (
                        <InstructionAddress key={i} address={address} />
                    ))}
                </>
            );
        case 'sol':
            return <SolBalance lamports={value.lamports} />;
        case 'bytes':
            return <>{`${value.size} byte(s)`}</>;
        case 'epoch':
            return <Epoch epoch={value.epoch} link />;
        case 'slot':
            return <Slot slot={value.slot} link />;
        case 'string':
            return (
                <div className="flex items-baseline">
                    <Copyable text={value.value}>
                        <code className="whitespace-normal break-all">{value.value}</code>
                    </Copyable>
                </div>
            );
        case 'text':
            return <>{value.value}</>;
        case 'timestamp':
            return <Timestamp unixTimestamp={value.unixSeconds} />;
        case 'preformatted':
            return (
                <pre className="mb-0 block w-fit whitespace-pre-wrap [overflow-wrap:anywhere]">
                    {joinLines(value.value)}
                </pre>
            );
        case 'json':
            return (
                <div className="[&_.string-value]:break-all">
                    <SolarizedJsonViewer src={value.value} />
                </div>
            );
    }
}

function joinLines(value: string | ReadonlyArray<string | number>): string {
    return typeof value === 'string' ? value : value.join('\n');
}

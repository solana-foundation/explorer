import React from 'react';

import { KeyValue } from '@/app/shared/ui/key-value/KeyValue';

export type KeyValueRow = {
    label: React.ReactNode;
    value: React.ReactNode;
    valueClassName?: string;
};

export type KeyValueRowInput = KeyValueRow | false | 0 | 0n | '' | null | undefined;

export function KeyValueRows({ rows }: { rows: ReadonlyArray<KeyValueRowInput> }) {
    return (
        <>
            {rows
                .map((row, index) => ({ index, row }))
                .filter((entry): entry is { index: number; row: KeyValueRow } => Boolean(entry.row))
                .map(({ index, row: { label, value, valueClassName } }) => (
                    <KeyValue
                        key={typeof label === 'string' ? label : index}
                        label={label}
                        valueClassName={valueClassName}
                    >
                        {value}
                    </KeyValue>
                ))}
        </>
    );
}

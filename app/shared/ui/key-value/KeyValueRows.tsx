import React from 'react';

import { KeyValue } from '@/app/shared/ui/key-value/KeyValue';

export type KeyValueRow = {
    label: React.ReactNode;
    value: React.ReactNode;
    show?: boolean;
    valueClassName?: string;
};

export function KeyValueRows({ rows }: { rows: KeyValueRow[] }) {
    return (
        <>
            {rows
                .map((row, index) => ({ index, row }))
                .filter(({ row }) => row.show !== false)
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

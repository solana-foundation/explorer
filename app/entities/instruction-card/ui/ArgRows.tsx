'use client';

import { ExpandableRow, FieldNameCell } from '@shared/ui/expandable-row';
import { cva } from 'class-variance-authority';

import { BaseTable } from '@/app/shared/ui/Table';

import type { InstructionArg } from '../model/args';
import { ValueCell } from './ValueCell';

export function ArgRows({ args, depth = 0 }: { args: readonly InstructionArg[]; depth?: number }) {
    return (
        <>
            {args.map((arg, index) => (
                <ArgRow key={arg.name} arg={arg} depth={depth} testId={`ix-args-${depth}-${index}`} />
            ))}
        </>
    );
}

function ArgRow({ arg, depth, testId }: { arg: InstructionArg; depth: number; testId: string }) {
    if (arg.kind === 'group') {
        return (
            <ExpandableRow fieldName={arg.name} fieldType={arg.type} nestingLevel={depth} data-testid={testId}>
                <ArgRows args={arg.children} depth={depth + 1} />
            </ExpandableRow>
        );
    }
    return (
        <BaseTable.Row data-testid={testId} className={leafRowVariants({ nested: depth > 0 })}>
            <FieldNameCell name={arg.name} nestingLevel={depth} />
            <BaseTable.Cell>{arg.type}</BaseTable.Cell>
            {arg.kind === 'leaf' ? <ValueCell value={arg.value} /> : <BaseTable.Cell />}
        </BaseTable.Row>
    );
}

const leafRowVariants = cva('', {
    defaultVariants: { nested: false },
    variants: { nested: { false: '', true: 'bg-black/20' } },
});

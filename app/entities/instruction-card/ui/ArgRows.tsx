'use client';

import { cva } from 'class-variance-authority';

import { BaseTable } from '@/app/shared/ui/Table';

import type { InstructionArg } from '../model/args';
import { ExpandableRow, FieldNameCell } from './ExpandableRow';
import { ValueCell } from './ValueCell';

/** The header row and the rows of an argument table. An empty list draws nothing. */
export function ArgTable({ label, args }: { label: string; args: readonly InstructionArg[] }) {
    return (
        args.length > 0 && (
            <>
                <BaseTable.SectionRow>
                    <BaseTable.Cell>{label}</BaseTable.Cell>
                    <BaseTable.Cell>Type</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">Value</BaseTable.Cell>
                </BaseTable.SectionRow>
                <ArgRows args={args} />
            </>
        )
    );
}

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
        <BaseTable.Row data-testid={testId} className={nestedRowVariants({ nested: depth > 0 })}>
            <FieldNameCell name={arg.name} nestingLevel={depth} />
            <BaseTable.Cell>{arg.type}</BaseTable.Cell>
            {arg.kind === 'leaf' ? <ValueCell value={arg.value} /> : <BaseTable.Cell />}
        </BaseTable.Row>
    );
}

export const nestedRowVariants = cva('', {
    defaultVariants: { nested: false },
    variants: { nested: { false: '', true: 'bg-black/20' } },
});

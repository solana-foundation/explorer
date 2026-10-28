'use client';

import type { PublicKey } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import {
    compactFields,
    type InstructionAccountField,
    type InstructionBlockField,
    type InstructionFieldList,
    type InstructionValueField,
} from '../model/fields';
import { AccountNameCell } from './AccountNameCell';
import { FieldBlock } from './FieldBlock';
import { ProgramField } from './ProgramField';
import { ValueCell } from './ValueCell';

export function InstructionFields({ fields, programId }: { fields: InstructionFieldList; programId: PublicKey }) {
    return (
        <>
            <ProgramField programId={programId} />
            <InstructionFieldRows fields={fields} />
        </>
    );
}

/**
 * The rows without the leading `Program` row, for a card that repeats groups of rows below one program.
 * `columns` is for a card whose table is wider than two columns, so each row still reaches the right edge.
 */
export function InstructionFieldRows({ fields, columns = 2 }: { fields: InstructionFieldList; columns?: number }) {
    return (
        <>
            {compactFields(fields).map((field, i) => {
                const key = `${field.kind}-${i}`;
                switch (field.kind) {
                    case 'heading':
                        return <HeadingRow key={key} label={field.label} columns={columns} />;
                    case 'account':
                        return <AccountRow key={key} field={field} columns={columns} />;
                    case 'note':
                    case 'rawData':
                    case 'documentText':
                    case 'payload':
                        return <BlockRow key={key} block={field} columns={columns} />;
                    default:
                        return <FieldRow key={key} field={field} columns={columns} />;
                }
            })}
        </>
    );
}

function HeadingRow({ label, columns }: { label: string; columns: number }) {
    return (
        <BaseTable.SectionRow>
            <BaseTable.Cell colSpan={columns} className="lg:text-left" align="left">
                {label}
            </BaseTable.Cell>
        </BaseTable.SectionRow>
    );
}

function FieldRow({ field, columns }: { field: InstructionValueField; columns: number }) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell>{field.label}</BaseTable.Cell>
            <ValueCell value={field} colSpan={valueColSpan(columns)} />
        </BaseTable.Row>
    );
}

function AccountRow({ field, columns }: { field: InstructionAccountField; columns: number }) {
    return (
        <BaseTable.Row>
            <AccountNameCell label={field.label} isSigner={field.isSigner} isWritable={field.isWritable} />
            <ValueCell value={{ address: field.address, kind: 'address' }} colSpan={valueColSpan(columns)} />
        </BaseTable.Row>
    );
}

function BlockRow({ block, columns }: { block: InstructionBlockField; columns: number }) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell colSpan={columns}>
                <FieldBlock block={block} />
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

function valueColSpan(columns: number): number | undefined {
    return columns > 2 ? columns - 1 : undefined;
}

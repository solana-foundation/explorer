'use client';

import type { PublicKey } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import {
    compactFields,
    type InstructionAccountField,
    type InstructionFieldList,
    type InstructionValueField,
} from '../model/fields';
import { AccountNameCell } from './AccountNameCell';
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

/** The rows without the leading `Program` row, for a card that repeats groups of rows below one program. */
export function InstructionFieldRows({ fields }: { fields: InstructionFieldList }) {
    return (
        <>
            {compactFields(fields).map((field, i) => {
                const key = `${field.label}-${i}`;
                switch (field.kind) {
                    case 'heading':
                        return <HeadingRow key={key} label={field.label} />;
                    case 'account':
                        return <AccountRow key={key} field={field} />;
                    default:
                        return <FieldRow key={key} field={field} />;
                }
            })}
        </>
    );
}

function HeadingRow({ label }: { label: string }) {
    return (
        <BaseTable.SectionRow>
            <BaseTable.Cell colSpan={2} className="lg:text-left" align="left">
                {label}
            </BaseTable.Cell>
        </BaseTable.SectionRow>
    );
}

function FieldRow({ field }: { field: InstructionValueField }) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell>{field.label}</BaseTable.Cell>
            <ValueCell value={field} />
        </BaseTable.Row>
    );
}

function AccountRow({ field }: { field: InstructionAccountField }) {
    return (
        <BaseTable.Row>
            <AccountNameCell label={field.label} isSigner={field.isSigner} isWritable={field.isWritable} />
            <ValueCell value={{ address: field.address, kind: 'address' }} />
        </BaseTable.Row>
    );
}

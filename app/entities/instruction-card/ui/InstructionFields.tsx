'use client';

import type { PublicKey } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { compactFields, type InstructionFieldList, type InstructionValueField } from '../model/fields';
import { ProgramField } from './ProgramField';
import { ValueCell } from './ValueCell';

export function InstructionFields({ fields, programId }: { fields: InstructionFieldList; programId: PublicKey }) {
    return (
        <>
            <ProgramField programId={programId} />
            {compactFields(fields).map((field, i) =>
                field.kind === 'heading' ? (
                    <HeadingRow key={`${field.label}-${i}`} label={field.label} />
                ) : (
                    <FieldRow key={`${field.label}-${i}`} field={field} />
                ),
            )}
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

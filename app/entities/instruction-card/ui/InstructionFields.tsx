'use client';

import { Copyable } from '@components/common/Copyable';
import { SolBalance } from '@components/common/SolBalance';
import type { PublicKey } from '@solana/web3.js';
import React from 'react';

import { Logger } from '@/app/shared/lib/logger';
import { BaseTable } from '@/app/shared/ui/Table';

import { compactFields, type InstructionField, type InstructionFieldList } from '../model/fields';
import { useInstructionSurface } from '../model/surface';
import { ProgramField } from './ProgramField';

/**
 * Renders field descriptors as card rows. This is the only place that knows the
 * row markup, the right-alignment, and which address renderer the current
 * surface uses. The leading `Program` row is the one exception — `ProgramField`
 * owns it, because the inspector needs its own validator on that row.
 */
export function InstructionFields({ fields, programId }: { fields: InstructionFieldList; programId: PublicKey }) {
    const { showProgramField } = useInstructionSurface();

    return (
        <>
            {showProgramField && <ProgramField programId={programId} />}
            {compactFields(fields).map((field, i) => (
                <FieldRow key={`${field.label}-${i}`} field={field} />
            ))}
        </>
    );
}

function FieldRow({ field }: { field: InstructionField }) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell>{field.label}</BaseTable.Cell>
            <BaseTable.Cell className="text-right">
                <FieldValue field={field} />
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

/** Turns one descriptor into the cell content its `kind` calls for. */
function FieldValue({ field }: { field: InstructionField }) {
    const { Address } = useInstructionSurface();

    switch (field.kind) {
        case 'address':
            return <Address pubkey={field.pubkey} />;
        case 'sol':
            return <SolBalance lamports={field.lamports} />;
        case 'bytes':
            return <>{`${field.size} byte(s)`}</>;
        case 'seed':
            return (
                <Copyable text={field.seed}>
                    <code>{field.seed}</code>
                </Copyable>
            );
        case 'text':
            return <>{field.value}</>;
        case 'custom':
            return field.value;
        default:
            return reportUnrenderedKind(field);
    }
}

/**
 * Exhaustiveness check for `InstructionField`. Adding a `kind` without a branch
 * above fails the build here rather than silently rendering a blank cell. If one
 * still arrives at runtime — a descriptor built from unvalidated data — the row
 * renders empty and the kind is reported instead of crashing the whole card.
 */
function reportUnrenderedKind(field: never): undefined {
    Logger.error(new Error('[instruction-card] field kind has no renderer'), {
        kind: (field as InstructionField).kind,
    });
    return undefined;
}

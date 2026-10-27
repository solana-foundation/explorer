import {
    address,
    InstructionCardView,
    type InstructionField,
    InstructionFields,
    type InstructionNode,
    NameOnlyDetailsCard,
    text,
} from '@entities/instruction-card';
import type { DispatchResult } from '@entities/instruction-parser';
import { isDeprecatedSerumProgram, OPENBOOK_DEX_PROGRAM_LABEL, SERUM_INSTRUCTION_NAMES } from '@explorer/decoder-serum';
import type { Address } from '@solana/kit';
import React from 'react';

import type { SerumParsed } from '../lib/serum-parser';

type SerumDetailsCardProps = {
    node: InstructionNode;
    /** The dispatcher's verdict for a DEX instruction: decoded, or registered-but-unparsed. */
    ix: DispatchResult;
};

export function SerumDetailsCard({ node, ix }: SerumDetailsCardProps) {
    const parsed = 'unknown' in ix ? undefined : (ix.parsed as SerumParsed);
    const name = parsed ? SERUM_INSTRUCTION_NAMES[parsed.type] : 'Unknown';

    // Dead Serum DEX deployments get a name-only card; the active OpenBook fork keeps full decoding.
    if (isDeprecatedSerumProgram(ix.programId.toBase58())) {
        return <NameOnlyDetailsCard node={node} name={name} />;
    }

    const title = `${OPENBOOK_DEX_PROGRAM_LABEL} Program: ${name}`;
    if (!parsed || !('accounts' in parsed.info)) {
        return <InstructionCardView node={node} title={title} defaultRaw />;
    }

    const { info } = parsed;
    return (
        <InstructionCardView node={node} title={title}>
            <InstructionFields
                programId={node.programId}
                fields={[...accountFields(info.accounts), ...('data' in info ? dataFields(info.data) : [])]}
            />
        </InstructionCardView>
    );
}

function accountFields(accounts: Record<string, Address | Address[] | undefined>): InstructionField[] {
    return Object.entries(accounts).flatMap(([field, value]) => {
        if (value === undefined) return [];
        if (!Array.isArray(value)) return [address(fieldLabel(field), value)];
        return value.map((account, i) => address(`${fieldLabel(field)} #${i + 1}`, account));
    });
}

function dataFields(data: Record<string, string | number | bigint>): InstructionField[] {
    return Object.entries(data).map(([field, value]) => text(fieldLabel(field), formatDataValue(field, value)));
}

// Enums decode to lowerCamelCase strings (numeric fields stay number/bigint); humanize them like labels, keeping `side`'s BUY/SELL convention.
function formatDataValue(field: string, value: string | number | bigint): string {
    if (typeof value !== 'string') return String(value);
    return field === 'side' ? value.toUpperCase() : fieldLabel(value);
}

// e.g. `openOrdersOwner` → "Open Orders Owner"
function fieldLabel(field: string): string {
    const spaced = [...field].map(letter => (isUpperCase(letter) ? ` ${letter}` : letter)).join('');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function isUpperCase(letter: string): boolean {
    return letter !== letter.toLowerCase();
}

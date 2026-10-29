import {
    address,
    addresses,
    InstructionCardView,
    type InstructionField,
    InstructionFields,
    type InstructionNode,
    NameOnlyDetailsCard,
    text,
} from '@entities/instruction-card';
import type { ParsedInstructionInfo } from '@entities/instruction-parser';
import { isDeprecatedSerumProgram, OPENBOOK_DEX_PROGRAM_LABEL, SERUM_INSTRUCTION_NAMES } from '@explorer/decoder-serum';
import type { Address } from '@solana/kit';
import React from 'react';

import type { SerumParsed } from '../lib/serum-parser';

type SerumDetailsCardProps = {
    node: InstructionNode;
    /** `undefined` when the parser of the program cannot decode the instruction. */
    parsed: ParsedInstructionInfo | undefined;
};

export function SerumDetailsCard({ node, parsed }: SerumDetailsCardProps) {
    const parsedInfo = parsed as SerumParsed | undefined;
    const name = parsedInfo ? SERUM_INSTRUCTION_NAMES[parsedInfo.type] : 'Unknown';

    // Dead Serum DEX deployments get a name-only card; the active OpenBook fork keeps full decoding.
    if (isDeprecatedSerumProgram(node.programId.toBase58())) {
        return <NameOnlyDetailsCard node={node} name={name} />;
    }

    const title = `${OPENBOOK_DEX_PROGRAM_LABEL} Program: ${name}`;
    if (!parsedInfo || !('accounts' in parsedInfo.info)) {
        return <InstructionCardView node={node} title={title} />;
    }

    const { info } = parsedInfo;
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
        return value.length > 0 ? [addresses(fieldLabel(field), value)] : [];
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

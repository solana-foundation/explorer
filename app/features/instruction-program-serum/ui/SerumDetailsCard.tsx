import {
    address,
    custom,
    InstructionAddress,
    InstructionCardView,
    type InstructionField,
    InstructionFields,
    type InstructionNode,
    text,
} from '@entities/instruction-card';
import type { DispatchResult } from '@entities/instruction-parser';
import { isDeprecatedSerumProgram, OPENBOOK_DEX_PROGRAM_LABEL, SERUM_INSTRUCTION_NAMES } from '@explorer/decoder-serum';
import { useCluster } from '@providers/cluster';
import type { Address } from '@solana/kit';
import type { TransactionInstruction } from '@solana/web3.js';
import { getProgramName } from '@utils/tx';
import React from 'react';

import type { SerumParsed } from '../lib/serum-parser';

type SerumDetailsCardProps = {
    /** The dispatcher's verdict for a DEX instruction: decoded, or registered-but-unparsed. */
    ix: DispatchResult;
    /** Raw form, for the shell's account table and hex view. */
    raw: TransactionInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

export function SerumDetailsCard({ ix, raw, index, innerCards, childIndex }: SerumDetailsCardProps) {
    const { cluster } = useCluster();
    const node: InstructionNode = { childIndex, index, innerCards, ix: raw, programId: raw.programId };
    const parsed = 'unknown' in ix ? undefined : (ix.parsed as SerumParsed);
    const name = parsed ? SERUM_INSTRUCTION_NAMES[parsed.type] : 'Unknown';

    // Dead Serum DEX deployments get a name-only card; the active OpenBook fork keeps full decoding.
    const programId = ix.programId.toBase58();
    if (isDeprecatedSerumProgram(programId)) {
        return <InstructionCardView node={node} title={`${getProgramName(programId, cluster)}: ${name}`} defaultRaw />;
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
        return [
            custom(
                fieldLabel(field),
                <>
                    {value.map((account, i) => (
                        <InstructionAddress key={i} address={account} />
                    ))}
                </>,
            ),
        ];
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

'use client';

import {
    account,
    address,
    heading,
    type InstructionFieldList,
    InstructionFieldRows,
    text,
} from '@entities/instruction-card';
import { PublicKey } from '@solana/web3.js';
import { type ParsedTokenInstruction, TokenInstruction } from '@solana-program/token';

import { formatParsedInstruction } from '../lib/format-sub-instruction';
import type { DecodedParams, LabeledAccount } from '../lib/types';
import { useSubInstructionMintInfo } from '../model/use-sub-instruction-mint-info';

export function SubInstructionRow({
    parsed,
    extraSigners,
    index,
}: {
    parsed: ParsedTokenInstruction<string>;
    extraSigners: LabeledAccount[];
    index: number;
}) {
    const mintInfo = useSubInstructionMintInfo(parsed);
    const decoded = formatParsedInstruction(parsed, mintInfo, extraSigners);
    const typeName = TokenInstruction[parsed.instructionType] ?? 'Unknown';

    return <SubInstructionRowView decoded={decoded ?? undefined} index={index} typeName={typeName} />;
}

export function SubInstructionRowView({
    index,
    typeName,
    decoded,
}: {
    index: number;
    typeName: string;
    decoded?: DecodedParams;
}) {
    return <InstructionFieldRows fields={subInstructionFields({ decoded, index, typeName })} />;
}

function subInstructionFields({
    index,
    typeName,
    decoded,
}: {
    index: number;
    typeName: string;
    decoded?: DecodedParams;
}): InstructionFieldList {
    return [
        heading(`#${index + 1} ${typeName}`),
        ...(decoded?.fields ?? []).map(field =>
            field.isAddress ? address(field.label, new PublicKey(field.value)) : text(field.label, field.value),
        ),
        ...(decoded?.accounts ?? []).map(({ label, pubkey, isSigner, isWritable }) =>
            account(label, pubkey, { isSigner, isWritable }),
        ),
    ];
}

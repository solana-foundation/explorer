import { Address } from '@components/common/Address';
import { BaseRawDetails } from '@components/common/BaseRawDetails';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import {
    getAllocateInstructionDataDecoder,
    getCloseInstructionDataDecoder,
    getExtendInstructionDataDecoder,
    getInitializeInstructionDataDecoder,
    getSetAuthorityInstructionDataDecoder,
    getSetDataInstructionDataDecoder,
    getSetImmutableInstructionDataDecoder,
    getTrimInstructionDataDecoder,
    getWriteInstructionDataDecoder,
    identifyProgramMetadataInstruction,
    PROGRAM_METADATA_PROGRAM_ADDRESS,
    ProgramMetadataInstruction,
} from '@solana-program/program-metadata';
import { camelToTitleCase } from '@utils/index';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { UnknownDetailsCard } from '../UnknownDetailsCard';

export const PROGRAM_METADATA_PROGRAM_ID = PROGRAM_METADATA_PROGRAM_ADDRESS as string;

// Deterministic decoders for the Program Metadata Program's own instructions (no IDL fetch needed).
const DATA_DECODERS: Partial<Record<ProgramMetadataInstruction, () => { decode: (d: Uint8Array) => object }>> = {
    [ProgramMetadataInstruction.Allocate]: getAllocateInstructionDataDecoder,
    [ProgramMetadataInstruction.Close]: getCloseInstructionDataDecoder,
    [ProgramMetadataInstruction.Extend]: getExtendInstructionDataDecoder,
    [ProgramMetadataInstruction.Initialize]: getInitializeInstructionDataDecoder,
    [ProgramMetadataInstruction.SetAuthority]: getSetAuthorityInstructionDataDecoder,
    [ProgramMetadataInstruction.SetData]: getSetDataInstructionDataDecoder,
    [ProgramMetadataInstruction.SetImmutable]: getSetImmutableInstructionDataDecoder,
    [ProgramMetadataInstruction.Trim]: getTrimInstructionDataDecoder,
    [ProgramMetadataInstruction.Write]: getWriteInstructionDataDecoder,
};

type DetailsProps = {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
    raw?: TransactionInstruction;
    InstructionCardComponent?: React.FC<Parameters<typeof InstructionCard>[0]>;
};

// Render a Codama-decoded value: unwrap Option, stringify bigints/bytes, surface enum kinds.
function renderValue(value: unknown): React.ReactNode {
    if (value === null || value === undefined) return <span className="text-dk-gray-700">None</span>;
    if (typeof value === 'object' && '__option' in (value as object)) {
        const opt = value as { __option: string; value?: unknown };
        return opt.__option === 'Some' ? renderValue(opt.value) : <span className="text-dk-gray-700">None</span>;
    }
    if (typeof value === 'bigint') return value.toString();
    if (value instanceof Uint8Array) return Buffer.from(value).toString('base64');
    if (typeof value === 'object' && '__kind' in (value as object)) return String((value as { __kind: string }).__kind);
    if (typeof value === 'object') {
        return JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
    }
    return String(value);
}

export function ProgramMetadataDetailsCard(props: DetailsProps) {
    const { ix, InstructionCardComponent = InstructionCard } = props;

    try {
        const instructionType = identifyProgramMetadataInstruction(ix.data);
        const name = ProgramMetadataInstruction[instructionType];
        const decoder = DATA_DECODERS[instructionType];
        const decoded = decoder ? (decoder().decode(ix.data) as Record<string, unknown>) : {};

        // `discriminator` is the instruction selector, not a meaningful arg — hide it.
        const fields = Object.entries(decoded).filter(([key]) => key !== 'discriminator');

        return (
            <InstructionCardComponent {...props} title={`Program Metadata Program: ${camelToTitleCase(name)}`}>
                <BaseTable.Row>
                    <BaseTable.Cell>Program</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <Address pubkey={ix.programId} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>
                {fields.map(([key, value]) => (
                    <BaseTable.Row key={key} data-testid={`ix-args-${key}`}>
                        <BaseTable.Cell>{camelToTitleCase(key)}</BaseTable.Cell>
                        <BaseTable.Cell className="text-right">{renderValue(value)}</BaseTable.Cell>
                    </BaseTable.Row>
                ))}
                <BaseRawDetails ix={ix} />
            </InstructionCardComponent>
        );
    } catch {
        return <UnknownDetailsCard {...props} />;
    }
}

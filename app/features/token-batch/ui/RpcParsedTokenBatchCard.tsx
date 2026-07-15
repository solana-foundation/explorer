// Renders a Token / Token-2022 batch instruction that the Solana RPC has
// already parsed into structured JSON. Used when the transaction page receives
// a ParsedInstruction (type "batch") instead of a PartiallyDecodedInstruction
// with raw bytes.

import { InstructionCard } from '@components/instruction/InstructionCard';
import { ParsedInstruction, PublicKey, SignatureResult } from '@solana/web3.js';
import { capitalCase } from 'change-case';
import type { ReactNode } from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import type { DecodedParams } from '../lib/types';
import { SubInstructionRowView } from './SubInstructionRow';

type RpcSubInstruction = { type: string; info: Record<string, unknown> };

function isValidPublicKey(value: string): boolean {
    try {
        new PublicKey(value);
        return true;
    } catch {
        return false;
    }
}

function stringifyValue(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value) ?? '';
}

function rpcInfoToDecodedParams(info: Record<string, unknown>): DecodedParams {
    return {
        accounts: [],
        fields: Object.entries(info).map(([key, value]) => {
            const str = stringifyValue(value);
            return { isAddress: isValidPublicKey(str), label: capitalCase(key), value: str };
        }),
    };
}

export function RpcParsedTokenBatchCard({
    ix,
    index,
    result,
    innerCards,
    childIndex,
}: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: ReactNode[];
    childIndex?: number;
}) {
    // ix.parsed is string | ParsedInfo; for batch it's always ParsedInfo
    const parsedInfo = typeof ix.parsed !== 'string' ? ix.parsed : undefined;
    const instructions: RpcSubInstruction[] = parsedInfo?.info?.instructions ?? [];
    const title = `Token Program: Batch (${instructions.length} instruction${instructions.length !== 1 ? 's' : ''})`;

    return (
        <InstructionCard title={title} collapsible {...{ childIndex, index, innerCards, ix, result }}>
            <BaseTable.Row>
                <BaseTable.Cell colSpan={3} className="p-0">
                    <div className="pb-2">
                        {instructions.map((sub, i) => (
                            <SubInstructionRowView
                                key={i}
                                index={i}
                                typeName={capitalCase(sub.type)}
                                decoded={rpcInfoToDecodedParams(sub.info ?? {})}
                            />
                        ))}
                    </div>
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}

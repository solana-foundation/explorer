import { ParsedInstruction } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

export function BaseRawParsedDetails({ ix, children }: { ix: ParsedInstruction; children?: React.ReactNode }) {
    return (
        <>
            {children}

            <BaseTable.Row>
                <BaseTable.Cell>
                    Instruction Data <span className="text-dk-gray-700">(JSON)</span>
                </BaseTable.Cell>
                <BaseTable.Cell>
                    <pre className="block w-fit max-w-[36rem] whitespace-pre-wrap [overflow-wrap:anywhere]">
                        {JSON.stringify(ix.parsed, bigintAsString, 2)}
                    </pre>
                </BaseTable.Cell>
            </BaseTable.Row>
        </>
    );
}

// A parser slice decodes a u64 as a bigint, which `JSON.stringify` throws on.
function bigintAsString(_key: string, value: unknown) {
    return typeof value === 'bigint' ? value.toString() : value;
}

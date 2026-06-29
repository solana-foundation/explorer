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
                <BaseTable.Cell className="text-right">
                    <pre className="inline-block max-w-[36rem] whitespace-pre-wrap break-words text-left">
                        {JSON.stringify(ix.parsed, null, 2)}
                    </pre>
                </BaseTable.Cell>
            </BaseTable.Row>
        </>
    );
}

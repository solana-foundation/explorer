import { ParsedInstruction } from '@solana/web3.js';
import React from 'react';

export function BaseRawParsedDetails({ ix, children }: { ix: ParsedInstruction; children?: React.ReactNode }) {
    return (
        <>
            {children}

            <tr className="grid grid-flow-col grid-rows-1 gap-4">
                <td>
                    Instruction Data <span className="text-muted">(JSON)</span>
                </td>
                <td className="text-lg-end">
                    <pre className="d-inline-block text-start json-wrap">{JSON.stringify(ix.parsed, null, 2)}</pre>
                </td>
            </tr>
        </>
    );
}

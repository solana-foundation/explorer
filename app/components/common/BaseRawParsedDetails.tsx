import { ParsedInstruction } from '@solana/web3.js';
import React from 'react';

export function BaseRawParsedDetails({ ix, children }: { ix: ParsedInstruction; children?: React.ReactNode }) {
    return (
        <>
            {children}

            <tr>
                <td>
                    Instruction Data <span className="text-muted">(JSON)</span>
                </td>
                <td className="e-text-right">
                    <pre className="json-wrap e-inline-block e-text-left">{JSON.stringify(ix.parsed, null, 2)}</pre>
                </td>
            </tr>
        </>
    );
}

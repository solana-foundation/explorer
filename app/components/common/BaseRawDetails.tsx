import { Address } from '@components/common/Address';
import { TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { HexData } from './HexData';

/**
 *  Component that displays accounts from any Instruction.
 *
 *  VersionedMessage is optional as it will be present at inspector page only.
 */
export function BaseRawDetails({ ix }: { ix: TransactionInstruction }) {
    return <BaseTransactionInstructionRawDetails ix={ix} />;
}

function BaseTransactionInstructionRawDetails({ ix }: { ix: TransactionInstruction }) {
    return (
        <>
            {ix.keys.map(({ pubkey, isSigner, isWritable }, keyIndex) => (
                <tr key={keyIndex}>
                    <td>
                        <div className="me-2 d-md-inline">Account #{keyIndex + 1}</div>
                        {isWritable && <span className="badge bg-danger-soft me-1">Writable</span>}
                        {isSigner && <span className="badge bg-info-soft me-1">Signer</span>}
                    </td>
                    <td className="text-lg-end">
                        <Address pubkey={pubkey} alignRight link />
                    </td>
                </tr>
            ))}

            <tr>
                <td>
                    Instruction Data <span className="text-muted">(Hex)</span>
                </td>
                <td className="text-lg-end">
                    <HexData raw={ix.data} />
                </td>
            </tr>
        </>
    );
}

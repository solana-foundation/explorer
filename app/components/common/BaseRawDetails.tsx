import { Address } from '@components/common/Address';
import { TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { HexData } from './HexData';

function RawDetailsLoader() {
    return (
        <tr>
            <td colSpan={2} className="e-text-center">
                <span className="spinner-grow spinner-grow-sm e-mr-1.5"></span>
                Loading instruction data...
            </td>
        </tr>
    );
}

/**
 *  Component that displays accounts from any Instruction.
 *
 *  VersionedMessage is optional as it will be present at inspector page only.
 */
export function BaseRawDetails({ ix }: { ix?: TransactionInstruction }) {
    if (!ix) {
        return <RawDetailsLoader />;
    }
    return <BaseTransactionInstructionRawDetails ix={ix} />;
}

function BaseTransactionInstructionRawDetails({ ix }: { ix: TransactionInstruction }) {
    return (
        <>
            {ix.keys.map(({ pubkey, isSigner, isWritable }, keyIndex) => (
                <tr key={keyIndex}>
                    <td>
                        <div className="e-mr-1.5 md:e-inline">Account #{keyIndex + 1}</div>
                        {isWritable && <span className="badge bg-danger-soft e-mr-[3px]">Writable</span>}
                        {isSigner && <span className="badge bg-info-soft e-mr-[3px]">Signer</span>}
                    </td>
                    <td className="e-text-right">
                        <Address pubkey={pubkey} alignRight link />
                    </td>
                </tr>
            ))}

            <tr>
                <td>
                    Instruction Data <span className="text-muted">(Hex)</span>
                </td>
                <td className="e-text-right">
                    <HexData raw={ix.data} />
                </td>
            </tr>
        </>
    );
}

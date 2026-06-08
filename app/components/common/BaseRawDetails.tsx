import { Address } from '@components/common/Address';
import { TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { Badge } from '@/app/components/shared/ui/badge';
import { BaseTable } from '@/app/shared/ui/Table';

import { HexData } from './HexData';

function RawDetailsLoader() {
    return (
        <BaseTable.Row>
            <BaseTable.Cell colSpan={2} className="e-text-center">
                <span className="spinner-grow spinner-grow-sm e-mr-1.5"></span>
                Loading instruction data...
            </BaseTable.Cell>
        </BaseTable.Row>
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
                <BaseTable.Row key={keyIndex}>
                    <BaseTable.Cell>
                        <div className="e-mr-1.5 md:e-inline">Account #{keyIndex + 1}</div>
                        {isWritable && (
                            <Badge ui="dashkit" variant="destructive" className="e-mr-[3px]">
                                Writable
                            </Badge>
                        )}
                        {isSigner && (
                            <Badge ui="dashkit" variant="info" className="e-mr-[3px]">
                                Signer
                            </Badge>
                        )}
                    </BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">
                        <Address pubkey={pubkey} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>
            ))}

            <BaseTable.Row>
                <BaseTable.Cell>
                    Instruction Data <span className="text-muted">(Hex)</span>
                </BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <HexData raw={ix.data} />
                </BaseTable.Cell>
            </BaseTable.Row>
        </>
    );
}

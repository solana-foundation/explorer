import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { useCluster } from '@providers/cluster';
import { address } from '@solana/kit';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import {
    ComputeBudgetInstruction,
    identifyComputeBudgetInstruction,
    parseRequestHeapFrameInstruction,
    parseRequestUnitsInstruction,
    parseSetComputeUnitLimitInstruction,
    parseSetComputeUnitPriceInstruction,
    parseSetLoadedAccountsDataSizeLimitInstruction,
} from '@solana-program/compute-budget';
import { microLamportsToLamportsString } from '@utils/index';
import React from 'react';

import { Logger } from '@/app/shared/lib/logger';
import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from './InstructionCard';

export function ComputeBudgetDetailsCard({
    ix,
    index,
    result,
    signature,
    innerCards,
    childIndex,
    InstructionCardComponent = InstructionCard,
}: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    signature: string;
    innerCards?: JSX.Element[];
    childIndex?: number;
    InstructionCardComponent?: React.FC<Parameters<typeof InstructionCard>[0]>;
}) {
    const { url } = useCluster();

    try {
        const type = identifyComputeBudgetInstruction(ix);
        switch (type) {
            case ComputeBudgetInstruction.RequestUnits: {
                const idata = { ...ix, programAddress: address(ix.programId.toBase58()) };
                const {
                    data: { units, additionalFee },
                } = parseRequestUnitsInstruction(idata);
                return (
                    <InstructionCardComponent
                        ix={ix}
                        index={index}
                        result={result}
                        title="Compute Budget Program: Request Units (Deprecated)"
                        innerCards={innerCards}
                        childIndex={childIndex}
                    >
                        <BaseTable.Row>
                            <BaseTable.Cell>Program</BaseTable.Cell>
                            <BaseTable.Cell className="text-right">
                                <Address pubkey={ix.programId} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>

                        <BaseTable.Row>
                            <BaseTable.Cell>Requested Compute Units</BaseTable.Cell>
                            <BaseTable.Cell className="text-right font-mono">{`${new Intl.NumberFormat('en-US').format(
                                units,
                            )} compute units`}</BaseTable.Cell>
                        </BaseTable.Row>

                        <BaseTable.Row>
                            <BaseTable.Cell>Additional Fee (SOL)</BaseTable.Cell>
                            <BaseTable.Cell className="text-right">
                                <SolBalance lamports={additionalFee} />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    </InstructionCardComponent>
                );
            }
            case ComputeBudgetInstruction.RequestHeapFrame: {
                const {
                    data: { bytes },
                } = parseRequestHeapFrameInstruction({ ...ix, programAddress: address(ix.programId.toBase58()) });
                return (
                    <InstructionCardComponent
                        ix={ix}
                        index={index}
                        result={result}
                        title="Compute Budget Program: Request Heap Frame"
                        innerCards={innerCards}
                        childIndex={childIndex}
                    >
                        <BaseTable.Row>
                            <BaseTable.Cell>Program</BaseTable.Cell>
                            <BaseTable.Cell className="text-right">
                                <Address pubkey={ix.programId} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>

                        <BaseTable.Row>
                            <BaseTable.Cell>Requested Heap Frame (Bytes)</BaseTable.Cell>
                            <BaseTable.Cell className="text-right font-mono">
                                {new Intl.NumberFormat('en-US').format(bytes)}
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    </InstructionCardComponent>
                );
            }
            case ComputeBudgetInstruction.SetComputeUnitLimit: {
                const {
                    data: { units },
                } = parseSetComputeUnitLimitInstruction({ ...ix, programAddress: address(ix.programId.toBase58()) });
                return (
                    <InstructionCardComponent
                        ix={ix}
                        index={index}
                        result={result}
                        title="Compute Budget Program: Set Compute Unit Limit"
                        innerCards={innerCards}
                        childIndex={childIndex}
                    >
                        <BaseTable.Row>
                            <BaseTable.Cell>Program</BaseTable.Cell>
                            <BaseTable.Cell className="text-right">
                                <Address pubkey={ix.programId} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>

                        <BaseTable.Row>
                            <BaseTable.Cell>Compute Unit Limit</BaseTable.Cell>
                            <BaseTable.Cell className="text-right font-mono">{`${new Intl.NumberFormat('en-US').format(
                                units,
                            )} compute units`}</BaseTable.Cell>
                        </BaseTable.Row>
                    </InstructionCardComponent>
                );
            }
            case ComputeBudgetInstruction.SetComputeUnitPrice: {
                const {
                    data: { microLamports },
                } = parseSetComputeUnitPriceInstruction({
                    ...ix,
                    programAddress: address(ix.programId.toBase58()),
                });
                return (
                    <InstructionCardComponent
                        ix={ix}
                        index={index}
                        result={result}
                        title="Compute Budget Program: Set Compute Unit Price"
                        innerCards={innerCards}
                        childIndex={childIndex}
                    >
                        <BaseTable.Row>
                            <BaseTable.Cell>Program</BaseTable.Cell>
                            <BaseTable.Cell className="text-right">
                                <Address pubkey={ix.programId} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>

                        <BaseTable.Row>
                            <BaseTable.Cell>Compute Unit Price</BaseTable.Cell>
                            <BaseTable.Cell className="text-right font-mono">{`${microLamportsToLamportsString(
                                microLamports,
                            )} lamports per compute unit`}</BaseTable.Cell>
                        </BaseTable.Row>
                    </InstructionCardComponent>
                );
            }
            case ComputeBudgetInstruction.SetLoadedAccountsDataSizeLimit: {
                const {
                    data: { accountDataSizeLimit },
                } = parseSetLoadedAccountsDataSizeLimitInstruction({
                    ...ix,
                    programAddress: address(ix.programId.toBase58()),
                });
                return (
                    <InstructionCardComponent
                        ix={ix}
                        index={index}
                        result={result}
                        title="Compute Budget Program: Set Loaded Account Data Size Limit"
                        innerCards={innerCards}
                        childIndex={childIndex}
                    >
                        <BaseTable.Row>
                            <BaseTable.Cell>Program</BaseTable.Cell>
                            <BaseTable.Cell className="text-right">
                                <Address pubkey={ix.programId} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>

                        <BaseTable.Row>
                            <BaseTable.Cell>Account Data Size Limit</BaseTable.Cell>
                            <BaseTable.Cell className="text-right font-mono">{`${accountDataSizeLimit} bytes`}</BaseTable.Cell>
                        </BaseTable.Row>
                    </InstructionCardComponent>
                );
            }
        }
    } catch (error) {
        Logger.error(error, {
            signature,
            url,
        });
    }

    return (
        <InstructionCardComponent
            ix={ix}
            index={index}
            result={result}
            title="Compute Budget Program: Unknown Instruction"
            innerCards={innerCards}
            childIndex={childIndex}
            defaultRaw
        />
    );
}

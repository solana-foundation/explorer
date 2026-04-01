import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { useAnchorProgram } from '@entities/idl';
import { useCluster } from '@providers/cluster';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
    AddressLookupTableAccount,
    type CompiledInnerInstruction,
    ComputeBudgetProgram,
    SystemProgram,
    TransactionInstruction,
    TransactionMessage,
    VersionedMessage,
} from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import { getProgramName } from '@utils/tx';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { isTokenBatchInstruction, resolveInnerBatchInstructions, TokenBatchCard } from '@/app/features/token-batch';
import { useAddressLookupTables } from '@/app/providers/accounts';
import { FetchStatus } from '@/app/providers/cache';

import { ErrorCard } from '../common/ErrorCard';
import { InspectorInstructionCard as InspectorInstructionCardComponent } from '../common/InspectorInstructionCard';
import { LoadingCard } from '../common/LoadingCard';
import AnchorDetailsCard from '../instruction/AnchorDetailsCard';
import { ComputeBudgetDetailsCard } from '../instruction/ComputeBudgetDetailsCard';
import { SystemDetailsCard } from '../instruction/system/SystemDetailsCard';
import { TokenDetailsCard } from '../instruction/token/TokenDetailsCard';
import { AssociatedTokenDetailsCard } from './associated-token/AssociatedTokenDetailsCard';
import { intoParsedInstruction, intoParsedTransaction } from './into-parsed-data';
import { UnknownDetailsCard } from './UnknownDetailsCard';

const INSPECTOR_RESULT = { err: null };

export function InstructionsSection({
    message,
    compiledInnerInstructions,
}: {
    message: VersionedMessage;
    compiledInnerInstructions?: CompiledInnerInstruction[];
}) {
    // Fetch all address lookup tables
    const hydratedTables = useAddressLookupTables(
        message.addressTableLookups.map(lookup => lookup.accountKey.toString()),
    );
    for (let i = 0; i < hydratedTables.length; i++) {
        const table = hydratedTables[i];
        if (table && table[1] === FetchStatus.FetchFailed) {
            return (
                <ErrorCard
                    text={`Failed to fetch address lookup table: ${message.addressTableLookups[
                        i
                    ].accountKey.toString()}`}
                />
            );
        }
    }

    const allDefined = hydratedTables.every(
        table => table !== undefined && table[0] instanceof AddressLookupTableAccount,
    );
    if (!allDefined) {
        return <LoadingCard />;
    }

    const addressLookupTableAccounts = (hydratedTables as any as Array<[AddressLookupTableAccount, FetchStatus]>).map(
        table => table[0],
    );
    const transactionMessage = TransactionMessage.decompile(message, { addressLookupTableAccounts });

    const batchByIndex = compiledInnerInstructions
        ? resolveInnerBatchInstructions(
              compiledInnerInstructions,
              message.getAccountKeys({ addressLookupTableAccounts }),
              message,
          )
        : {};

    return (
        <>
            {transactionMessage.instructions.map((ix, index) => {
                const batchInnerCards = batchByIndex[index]?.map((innerIx, childIndex) => (
                    <ErrorBoundary key={childIndex} fallback={null}>
                        <TokenBatchCard index={index} childIndex={childIndex} ix={innerIx} result={INSPECTOR_RESULT} />
                    </ErrorBoundary>
                ));

                return (
                    <InspectorInstructionCard
                        key={index}
                        index={index}
                        ix={ix}
                        message={message}
                        innerCards={batchInnerCards}
                    />
                );
            })}
        </>
    );
}

function InspectorInstructionCard({
    message,
    ix,
    index,
    innerCards,
}: {
    message: VersionedMessage;
    ix: TransactionInstruction;
    index: number;
    innerCards?: React.ReactNode[];
}) {
    const { cluster, url } = useCluster();

    const programId = ix.programId;
    const programName = getProgramName(programId.toBase58(), cluster);
    const anchorProgram = useAnchorProgram(programId.toString(), url, cluster);

    if (anchorProgram.program) {
        return (
            <ErrorBoundary
                fallback={<UnknownDetailsCard key={index} index={index} ix={ix} programName="Unknown Program" />}
            >
                <AnchorDetailsCard
                    anchorProgram={anchorProgram.program}
                    index={index}
                    innerCards={undefined}
                    ix={ix}
                    result={{ err: null }}
                    signature=""
                />
            </ErrorBoundary>
        );
    }

    if (isTokenBatchInstruction(ix)) {
        return (
            <ErrorBoundary
                fallback={<UnknownDetailsCard key={index} index={index} ix={ix} programName={programName} />}
            >
                <TokenBatchCard index={index} ix={ix} result={INSPECTOR_RESULT} />
            </ErrorBoundary>
        );
    }

    /// Handle program-specific cards here
    //  - keep signature (empty string as we do not submit anything) for backward compatibility with the data from Transaction
    //  - result is `err: null` as at this point there should not be errors
    const result = { err: null };
    const signature = '';

    switch (ix.programId.toString()) {
        case ASSOCIATED_TOKEN_PROGRAM_ID.toString(): {
            const asParsedInstruction = intoParsedInstruction(ix);
            return (
                <AssociatedTokenDetailsCard
                    key={index}
                    ix={asParsedInstruction}
                    raw={ix}
                    message={message}
                    index={index}
                    result={result}
                />
            );
        }
        case ComputeBudgetProgram.programId.toString(): {
            return (
                <ComputeBudgetDetailsCard
                    key={index}
                    ix={ix}
                    index={index}
                    result={result}
                    signature={signature}
                    InstructionCardComponent={BaseInstructionCard}
                />
            );
        }
        case SystemProgram.programId.toString(): {
            const asParsedInstruction = intoParsedInstruction(ix);
            const asParsedTransaction = intoParsedTransaction(ix, message);
            return (
                <SystemDetailsCard
                    key={index}
                    ix={asParsedInstruction}
                    tx={asParsedTransaction}
                    index={index}
                    result={result}
                    raw={ix}
                />
            );
        }
        case TOKEN_PROGRAM_ID.toString(): {
            const asParsedInstruction = intoParsedInstruction(ix);
            const asParsedTransaction = intoParsedTransaction(ix, message, [asParsedInstruction]);
            // Only render TokenDetailsCard if the instruction was successfully parsed
            if (asParsedInstruction.parsed?.type) {
                return (
                    <ErrorBoundary
                        fallback={<UnknownDetailsCard key={index} index={index} ix={ix} programName={programName} />}
                    >
                        <TokenDetailsCard
                            key={index}
                            ix={asParsedInstruction}
                            tx={asParsedTransaction}
                            index={index}
                            result={result}
                            InstructionCardComponent={InspectorInstructionCardComponent}
                            message={message}
                            raw={ix}
                        />
                    </ErrorBoundary>
                );
            }
            // Fall through to unknown if parsing failed
            break;
        }
        case TOKEN_2022_PROGRAM_ADDRESS: {
            const asParsedInstruction = intoParsedInstruction(ix);
            const asParsedTransaction = intoParsedTransaction(ix, message, [asParsedInstruction]);
            // Only render TokenDetailsCard if the instruction was successfully parsed
            if (asParsedInstruction.parsed?.type) {
                return (
                    <ErrorBoundary
                        fallback={<UnknownDetailsCard key={index} index={index} ix={ix} programName={programName} />}
                    >
                        <TokenDetailsCard
                            key={index}
                            ix={asParsedInstruction}
                            tx={asParsedTransaction}
                            index={index}
                            result={result}
                        />
                    </ErrorBoundary>
                );
            }
            // Fall through to unknown if parsing failed
            break;
        }
        default: {
            // unknown program; allow to render the next card
        }
    }

    return <UnknownDetailsCard key={index} index={index} ix={ix} programName={programName} innerCards={innerCards} />;
}

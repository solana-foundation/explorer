import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { useAnchorProgram } from '@entities/idl';
import { isParsedInstruction, toParsedTransaction, useInstructionParser } from '@entities/instruction-parser';
import { MetaplexTokenMetadataDetailsCard } from '@features/mpl-token-metadata';
import { useCluster } from '@providers/cluster';
import {
    AddressLookupTableAccount,
    type CompiledInnerInstruction,
    ComputeBudgetProgram,
    type TransactionInstruction,
    TransactionMessage,
    type VersionedMessage,
} from '@solana/web3.js';
import { getProgramName } from '@utils/tx';
import React, { useMemo } from 'react';
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
import { UnknownDetailsCard } from './UnknownDetailsCard';

const INSPECTOR_RESULT = { err: null };
const INSPECTOR_SIGNATURE = '';

export function InstructionsSection({
    message,
    compiledInnerInstructions,
}: {
    message: VersionedMessage;
    compiledInnerInstructions?: CompiledInnerInstruction[];
}) {
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
    const dispatcher = useInstructionParser();

    const programId = ix.programId;
    const programName = getProgramName(programId.toBase58(), cluster);
    const anchorProgram = useAnchorProgram(programId.toString(), url, cluster);
    const parsedIx = useMemo(() => dispatcher.fromTransactionInstruction(ix), [dispatcher, ix]);
    const parsedTx = useMemo(
        () => (isParsedInstruction(parsedIx) ? toParsedTransaction(ix, message, [parsedIx]) : undefined),
        [ix, message, parsedIx],
    );

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
                    result={INSPECTOR_RESULT}
                    signature={INSPECTOR_SIGNATURE}
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

    // Compute Budget instructions are not RPC-pre-parsed and its DetailsCard
    // decodes raw bytes directly, so no parser entry is needed today. Phase 3
    // of the unification will fold this into the registry.
    if (ComputeBudgetProgram.programId.equals(programId)) {
        return (
            <ComputeBudgetDetailsCard
                key={index}
                ix={ix}
                index={index}
                result={INSPECTOR_RESULT}
                signature={INSPECTOR_SIGNATURE}
                InstructionCardComponent={BaseInstructionCard}
            />
        );
    }

    if (!parsedIx) {
        return (
            <UnknownDetailsCard key={index} index={index} ix={ix} programName={programName} innerCards={innerCards} />
        );
    }

    if ('unknown' in parsedIx) {
        if (parsedIx.programLabel === 'mpl-token-metadata') {
            return (
                <ErrorBoundary
                    fallback={<UnknownDetailsCard key={index} index={index} ix={ix} programName={programName} />}
                >
                    <MetaplexTokenMetadataDetailsCard
                        key={index}
                        ix={ix}
                        index={index}
                        result={INSPECTOR_RESULT}
                        InstructionCardComponent={BaseInstructionCard}
                    />
                </ErrorBoundary>
            );
        }
        return (
            <UnknownDetailsCard key={index} index={index} ix={ix} programName={programName} innerCards={innerCards} />
        );
    }

    if (!parsedTx) {
        return (
            <UnknownDetailsCard key={index} index={index} ix={ix} programName={programName} innerCards={innerCards} />
        );
    }

    switch (parsedIx.program) {
        case 'system':
            return (
                <SystemDetailsCard
                    key={index}
                    ix={parsedIx}
                    tx={parsedTx}
                    index={index}
                    result={INSPECTOR_RESULT}
                    raw={ix}
                />
            );
        case 'spl-associated-token-account':
            return (
                <AssociatedTokenDetailsCard
                    key={index}
                    ix={parsedIx}
                    raw={ix}
                    message={message}
                    index={index}
                    result={INSPECTOR_RESULT}
                />
            );
        case 'spl-token':
            return (
                <ErrorBoundary
                    fallback={<UnknownDetailsCard key={index} index={index} ix={ix} programName={programName} />}
                >
                    <TokenDetailsCard
                        key={index}
                        ix={parsedIx}
                        tx={parsedTx}
                        index={index}
                        result={INSPECTOR_RESULT}
                        InstructionCardComponent={InspectorInstructionCardComponent}
                        message={message}
                        raw={ix}
                    />
                </ErrorBoundary>
            );
        case 'spl-token-2022':
            return (
                <ErrorBoundary
                    fallback={<UnknownDetailsCard key={index} index={index} ix={ix} programName={programName} />}
                >
                    <TokenDetailsCard key={index} ix={parsedIx} tx={parsedTx} index={index} result={INSPECTOR_RESULT} />
                </ErrorBoundary>
            );
        case 'mpl-token-metadata':
            return (
                <ErrorBoundary
                    fallback={<UnknownDetailsCard key={index} index={index} ix={ix} programName={programName} />}
                >
                    <MetaplexTokenMetadataDetailsCard
                        key={index}
                        ix={ix}
                        parsedIx={parsedIx}
                        index={index}
                        result={INSPECTOR_RESULT}
                        InstructionCardComponent={BaseInstructionCard}
                    />
                </ErrorBoundary>
            );
    }

    return <UnknownDetailsCard key={index} index={index} ix={ix} programName={programName} innerCards={innerCards} />;
}

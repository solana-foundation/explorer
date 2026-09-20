import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { CollapsibleSection } from '@components/shared/ui/collapsible-section';
import { type InstructionSurface, InstructionSurfaceProvider } from '@entities/instruction-card';
import { isParsedInstruction, toParsedTransaction, useInstructionParser } from '@entities/instruction-parser';
import {
    BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL,
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_LABEL,
    SPL_MEMO_PROGRAM_LABEL,
    SPL_TOKEN_2022_PROGRAM_LABEL,
    SPL_TOKEN_PROGRAM_LABEL,
    SYSTEM_PROGRAM_LABEL,
} from '@explorer/parsers';
import { AssociatedTokenDetailsCard } from '@features/decode-instruction-associated-token';
import { ComputeBudgetDetailsCard } from '@features/decode-instruction-compute-budget';
import { Ed25519DetailsCard } from '@features/decode-instruction-ed25519';
import { LighthouseDetailsCard } from '@features/decode-instruction-lighthouse';
import { MemoDetailsCard } from '@features/decode-instruction-memo';
import { isProgramMetadataInstruction } from '@features/decode-instruction-pmp/detection';
import { IdlInstructionCard, useIdlInstructionDecode } from '@features/decode-instruction-with-idl';
import { ZkElGamalProofDetailsCard } from '@features/decode-instruction-zk-elgamal-proof';
import { PythDetailsCard } from '@features/instruction-program-pyth';
import { MetaplexTokenMetadataDetailsCard } from '@features/mpl-token-metadata';
import { useScrollAnchor } from '@providers/scroll-anchor';
import {
    AddressLookupTableAccount,
    type CompiledInnerInstruction,
    type TransactionInstruction,
    TransactionMessage,
    type VersionedMessage,
} from '@solana/web3.js';
import getInstructionCardScrollAnchorId from '@utils/get-instruction-card-scroll-anchor-id';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { resolveInnerInstructions } from '@/app/entities/transaction-data';
import { isTokenBatchInstruction, TokenBatchCard } from '@/app/features/token-batch';
import { useAddressLookupTables } from '@/app/providers/accounts';
import { FetchStatus } from '@/app/providers/cache';

import { ErrorCard } from '../common/ErrorCard';
import { InspectorInstructionCard as InspectorInstructionCardComponent } from '../common/InspectorInstructionCard';
import { LoadingCard } from '../common/LoadingCard';
import { BpfUpgradeableLoaderDetailsCard } from '../instruction/bpf-upgradeable-loader/BpfUpgradeableLoaderDetailsCard';
import { SystemDetailsCard } from '../instruction/system/SystemDetailsCard';
import { TokenDetailsCard } from '../instruction/token/TokenDetailsCard';
import { AddressWithContextCell } from './AddressWithContextCell';
import { UnknownDetailsCard } from './UnknownDetailsCard';

const INSPECTOR_RESULT = { err: null };
const INSPECTOR_SIGNATURE = '';

// The PMP card carries the generated client plus pako/yaml/smol-toml (~35 kB gzip), which only a transaction that
// actually touches the program needs. `isProgramMetadataInstruction` comes from the light `/detection` entry so
// the branch below can stay static.
const PmpDetailsCard = dynamic(() => import('@features/decode-instruction-pmp').then(mod => mod.PmpDetailsCard), {
    loading: () => <LoadingCard />,
    ssr: false,
});

const INSPECTOR_SURFACE: InstructionSurface = {
    // The inspector resolves an address against the transaction under inspection
    // rather than linking out to its account page.
    Address: AddressWithContextCell,
    Shell: InspectorInstructionCardComponent,
    result: INSPECTOR_RESULT,
    // `InspectorInstructionCard` renders its own Program row, so the fields must not.
    showProgramField: false,
};

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

    const failedLookupIndex = hydratedTables.findIndex(table => table?.[1] === FetchStatus.FetchFailed);
    const lookupTables = hydratedTables.flatMap(table =>
        table?.[0] instanceof AddressLookupTableAccount ? [table[0]] : [],
    );
    const allLookupsResolved = lookupTables.length === hydratedTables.length;

    // `useAddressLookupTables` returns a new array on each render, so the memo below depends on
    // `lookupTablesKey` instead of `lookupTables`.
    // A table only gains addresses, so `lastExtendedSlot` and the address count identify its contents.
    const lookupTablesKey = lookupTables
        .map(table => `${table.key.toBase58()}:${table.state.lastExtendedSlot}:${table.state.addresses.length}`)
        .join('|');

    const decoded = useMemo(() => {
        if (!allLookupsResolved) return undefined;
        const addressLookupTableAccounts = lookupTables;
        return {
            innerByIndex: compiledInnerInstructions
                ? resolveInnerInstructions(
                      compiledInnerInstructions,
                      message.getAccountKeys({ addressLookupTableAccounts }),
                      message,
                  )
                : undefined,
            instructions: TransactionMessage.decompile(message, { addressLookupTableAccounts }).instructions,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- `lookupTablesKey` replaces `lookupTables`, which is a new array every render
    }, [allLookupsResolved, compiledInnerInstructions, lookupTablesKey, message]);

    if (failedLookupIndex >= 0) {
        return (
            <ErrorCard
                text={`Failed to fetch address lookup table: ${message.addressTableLookups[
                    failedLookupIndex
                ].accountKey.toString()}`}
            />
        );
    }

    if (!decoded) {
        return <LoadingCard />;
    }

    return (
        <CollapsibleSection id="instructions" title="Instructions" className="">
            <InstructionSurfaceProvider surface={INSPECTOR_SURFACE}>
                {decoded.instructions.map((ix, index) => {
                    const innerCards = decoded.innerByIndex?.get(index)?.map((innerIx, childIndex) =>
                        innerIx ? (
                            <ErrorBoundary
                                key={childIndex}
                                // `UnknownDetailsCard` renders the badge and the scroll anchor,
                                // so an inner instruction that throws keeps its number and anchor.
                                fallback={<UnknownDetailsCard index={index} childIndex={childIndex} ix={innerIx} />}
                            >
                                <InspectorInstructionCard
                                    index={index}
                                    childIndex={childIndex}
                                    ix={innerIx}
                                    message={message}
                                />
                            </ErrorBoundary>
                        ) : (
                            <UndisplayableInstructionCard key={childIndex} index={index} childIndex={childIndex} />
                        ),
                    );

                    return (
                        <InspectorInstructionCard
                            key={index}
                            index={index}
                            ix={ix}
                            message={message}
                            innerCards={innerCards}
                        />
                    );
                })}
            </InstructionSurfaceProvider>
        </CollapsibleSection>
    );
}

function UndisplayableInstructionCard({ index, childIndex }: { index: number; childIndex: number }) {
    const scrollAnchorRef = useScrollAnchor(getInstructionCardScrollAnchorId([index + 1, childIndex + 1]));

    return (
        <div ref={scrollAnchorRef}>
            <ErrorCard text={`Could not display instruction #${index + 1}.${childIndex + 1}, please report`} />
        </div>
    );
}

function InspectorInstructionCard({
    message,
    ix,
    index,
    childIndex,
    innerCards,
}: {
    message: VersionedMessage;
    ix: TransactionInstruction;
    index: number;
    childIndex?: number;
    innerCards?: JSX.Element[];
}) {
    const dispatcher = useInstructionParser();

    const programId = ix.programId;
    const parsedIx = useMemo(() => dispatcher.fromTransactionInstruction(ix), [dispatcher, ix]);
    const parsedTx = useMemo(
        () => (isParsedInstruction(parsedIx) ? toParsedTransaction(ix, message, [parsedIx]) : undefined),
        [ix, message, parsedIx],
    );

    const idlDecode = useIdlInstructionDecode({ programId: programId.toString(), raw: ix });
    // The IDL decoder returns `{ kind: 'unknown' }`, not `undefined`, when the IDL does not
    // declare the discriminator. The cards below must still render.
    const decodedByIdl = idlDecode?.kind === 'unknown' ? undefined : idlDecode;

    const unknownCard = <UnknownDetailsCard index={index} ix={ix} childIndex={childIndex} innerCards={innerCards} />;

    // PMP owns every instruction on its program id: `setData`/`initialize`/`write` render decoded content from
    // the bundled typed decoders (no IDL needed), and the housekeeping instructions delegate to the IDL tier
    // from inside the card. Must sit before the generic idlDecode tier so it wins for the content instructions.
    if (isProgramMetadataInstruction(ix)) {
        return (
            <PmpDetailsCard
                ix={ix}
                index={index}
                result={INSPECTOR_RESULT}
                InstructionCardComponent={BaseInstructionCard}
                childIndex={childIndex}
                innerCards={innerCards}
                // The card cannot import the IDL feature (boundaries/dependencies), so this surface decides what
                // a non-content PMP instruction falls back to. Same two outcomes as before the branch existed.
                fallback={
                    decodedByIdl ? (
                        <IdlInstructionCard
                            decoded={decodedByIdl}
                            ix={ix}
                            index={index}
                            result={INSPECTOR_RESULT}
                            signature={INSPECTOR_SIGNATURE}
                            childIndex={childIndex}
                            innerCards={innerCards}
                        />
                    ) : (
                        unknownCard
                    )
                }
            />
        );
    }

    if (decodedByIdl) {
        return (
            <IdlInstructionCard
                decoded={decodedByIdl}
                ix={ix}
                index={index}
                result={INSPECTOR_RESULT}
                signature={INSPECTOR_SIGNATURE}
                childIndex={childIndex}
                innerCards={innerCards}
            />
        );
    }

    if (isTokenBatchInstruction(ix)) {
        return (
            <ErrorBoundary fallback={unknownCard}>
                <TokenBatchCard
                    index={index}
                    ix={ix}
                    result={INSPECTOR_RESULT}
                    childIndex={childIndex}
                    innerCards={innerCards}
                />
            </ErrorBoundary>
        );
    }

    if (!parsedIx) {
        return unknownCard;
    }

    if ('unknown' in parsedIx) {
        if (parsedIx.programLabel === 'ed25519') {
            return (
                <Ed25519DetailsCard
                    key={index}
                    ix={parsedIx}
                    raw={ix}
                    siblingData={siblingIndex => message.compiledInstructions[siblingIndex]?.data}
                    index={index}
                    childIndex={childIndex}
                    innerCards={innerCards}
                />
            );
        }
        if (parsedIx.programLabel === 'zk-elgamal-proof') {
            return (
                <ZkElGamalProofDetailsCard
                    key={index}
                    ix={parsedIx}
                    raw={ix}
                    index={index}
                    childIndex={childIndex}
                    innerCards={innerCards}
                />
            );
        }
        if (parsedIx.programLabel === 'compute-budget') {
            return (
                <ComputeBudgetDetailsCard
                    key={index}
                    ix={parsedIx}
                    raw={ix}
                    index={index}
                    childIndex={childIndex}
                    innerCards={innerCards}
                />
            );
        }
        if (parsedIx.programLabel === 'pyth') {
            return (
                <ErrorBoundary fallback={unknownCard}>
                    <PythDetailsCard
                        key={index}
                        ix={parsedIx}
                        raw={ix}
                        index={index}
                        childIndex={childIndex}
                        innerCards={innerCards}
                    />
                </ErrorBoundary>
            );
        }
        if (parsedIx.programLabel === 'mpl-token-metadata') {
            return (
                <ErrorBoundary fallback={unknownCard}>
                    <MetaplexTokenMetadataDetailsCard
                        ix={ix}
                        index={index}
                        result={INSPECTOR_RESULT}
                        InstructionCardComponent={BaseInstructionCard}
                        childIndex={childIndex}
                        innerCards={innerCards}
                    />
                </ErrorBoundary>
            );
        }
        return unknownCard;
    }

    // `parsedTx` is non-null here by construction (it's built whenever `parsedIx`
    // is a ParsedInstruction, which the guards above guarantee). This guard exists
    // to narrow its type for the switch below — TS can't relate the two useMemos.
    if (!parsedTx) {
        return unknownCard;
    }

    // mpl-token-metadata / lighthouse / pyth below stay literal: dispatcher-only labels with no registry specimen (see ParserProgramLabel)
    switch (parsedIx.program) {
        case SYSTEM_PROGRAM_LABEL:
            return (
                <SystemDetailsCard
                    ix={parsedIx}
                    tx={parsedTx}
                    index={index}
                    result={INSPECTOR_RESULT}
                    raw={ix}
                    childIndex={childIndex}
                    innerCards={innerCards}
                />
            );
        case SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_LABEL:
            return (
                <AssociatedTokenDetailsCard
                    ix={parsedIx}
                    raw={ix}
                    index={index}
                    result={INSPECTOR_RESULT}
                    InstructionCardComponent={InspectorInstructionCardComponent}
                    AddressComponent={AddressWithContextCell}
                    showProgramField={false}
                    childIndex={childIndex}
                    innerCards={innerCards}
                />
            );
        case SPL_MEMO_PROGRAM_LABEL:
            return <MemoDetailsCard key={index} ix={parsedIx} index={index} />;
        case BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL:
            return (
                <ErrorBoundary fallback={unknownCard}>
                    <BpfUpgradeableLoaderDetailsCard
                        ix={parsedIx}
                        tx={parsedTx}
                        index={index}
                        result={INSPECTOR_RESULT}
                        raw={ix}
                        childIndex={childIndex}
                        innerCards={innerCards}
                    />
                </ErrorBoundary>
            );
        case SPL_TOKEN_PROGRAM_LABEL:
        case SPL_TOKEN_2022_PROGRAM_LABEL:
            return (
                <ErrorBoundary fallback={unknownCard}>
                    <TokenDetailsCard
                        ix={parsedIx}
                        tx={parsedTx}
                        index={index}
                        result={INSPECTOR_RESULT}
                        InstructionCardComponent={InspectorInstructionCardComponent}
                        raw={ix}
                        childIndex={childIndex}
                        innerCards={innerCards}
                    />
                </ErrorBoundary>
            );
        case 'mpl-token-metadata':
            return (
                <ErrorBoundary fallback={unknownCard}>
                    <MetaplexTokenMetadataDetailsCard
                        ix={ix}
                        parsedIx={parsedIx}
                        index={index}
                        result={INSPECTOR_RESULT}
                        InstructionCardComponent={BaseInstructionCard}
                        childIndex={childIndex}
                        innerCards={innerCards}
                    />
                </ErrorBoundary>
            );
        case 'lighthouse':
            return (
                <ErrorBoundary fallback={unknownCard}>
                    <LighthouseDetailsCard
                        ix={parsedIx}
                        raw={ix}
                        index={index}
                        result={INSPECTOR_RESULT}
                        childIndex={childIndex}
                        innerCards={innerCards}
                    />
                </ErrorBoundary>
            );
        case 'pyth':
            return (
                <ErrorBoundary fallback={unknownCard}>
                    <PythDetailsCard
                        key={index}
                        ix={parsedIx}
                        raw={ix}
                        index={index}
                        childIndex={childIndex}
                        innerCards={innerCards}
                    />
                </ErrorBoundary>
            );
        case 'ed25519':
            return (
                <ErrorBoundary fallback={unknownCard}>
                    <Ed25519DetailsCard
                        key={index}
                        ix={parsedIx}
                        raw={ix}
                        siblingData={siblingIndex => message.compiledInstructions[siblingIndex]?.data}
                        index={index}
                        childIndex={childIndex}
                        innerCards={innerCards}
                    />
                </ErrorBoundary>
            );
        case 'zk-elgamal-proof':
            return (
                <ErrorBoundary fallback={unknownCard}>
                    <ZkElGamalProofDetailsCard
                        key={index}
                        ix={parsedIx}
                        raw={ix}
                        index={index}
                        childIndex={childIndex}
                        innerCards={innerCards}
                    />
                </ErrorBoundary>
            );
        case 'compute-budget':
            return (
                <ErrorBoundary
                    fallback={<UnknownDetailsCard key={index} index={index} ix={ix} programName={programName} />}
                >
                    <ComputeBudgetDetailsCard
                        key={index}
                        ix={parsedIx}
                        raw={ix}
                        index={index}
                        childIndex={childIndex}
                        innerCards={innerCards}
                    />
                </ErrorBoundary>
            );
    }

    return unknownCard;
}

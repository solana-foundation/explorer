import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { BpfUpgradeableLoaderDetailsCard } from '@components/instruction/bpf-upgradeable-loader/BpfUpgradeableLoaderDetailsCard';
import { SystemDetailsCard } from '@components/instruction/system/SystemDetailsCard';
import { TokenDetailsCard } from '@components/instruction/token/TokenDetailsCard';
import { CollapsibleSection } from '@components/shared/ui/collapsible-section';
import {
    NameOnlyDetailsCard,
    toInstructionNode,
    TxInstructionSurface,
    UnknownDetailsCard,
} from '@entities/instruction-card';
import { isParsedInstruction, type ParserProgramLabel, useInstructionParser } from '@entities/instruction-parser';
import { trustedInnerInstructions } from '@entities/transaction-data';
import { isPythProgramId } from '@explorer/decoder-pyth/detection';
import {
    ADDRESS_LOOKUP_TABLE_PROGRAM_LABEL,
    BPF_LOADER_PROGRAM_LABEL,
    BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL,
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_LABEL,
    SPL_MEMO_PROGRAM_LABEL,
    SPL_TOKEN_2022_PROGRAM_LABEL,
    SPL_TOKEN_PROGRAM_LABEL,
    STAKE_PROGRAM_LABEL,
    SYSTEM_PROGRAM_LABEL,
    VOTE_PROGRAM_LABEL,
} from '@explorer/parsers';
import { AddressLookupTableDetailsCard } from '@features/decode-instruction-address-lookup-table';
import { AssociatedTokenDetailsCard } from '@features/decode-instruction-associated-token';
import { BpfLoaderDetailsCard } from '@features/decode-instruction-bpf-loader';
import { ComputeBudgetDetailsCard, isComputeBudgetInstruction } from '@features/decode-instruction-compute-budget';
import {
    Ed25519DetailsCard,
    isEd25519Instruction,
    siblingDataFromParsedTransaction,
} from '@features/decode-instruction-ed25519';
import { isLighthouseInstruction, LighthouseDetailsCard } from '@features/decode-instruction-lighthouse';
import { MemoDetailsCard } from '@features/decode-instruction-memo';
import { isProgramMetadataInstruction } from '@features/decode-instruction-pmp/detection';
import { isSolanaAttestationInstruction, SolanaAttestationDetailsCard } from '@features/decode-instruction-sas';
import { IdlInstructionCard, useIdlInstructionDecode } from '@features/decode-instruction-with-idl';
import { isZkElGamalProofInstruction, ZkElGamalProofDetailsCard } from '@features/decode-instruction-zk-elgamal-proof';
import { PythDetailsCard } from '@features/instruction-program-pyth';
import { SERUM_PROGRAM_LABEL, SerumDetailsCard } from '@features/instruction-program-serum';
import { MetaplexTokenMetadataDetailsCard } from '@features/mpl-token-metadata';
import { isStakeInstruction, RawStakeDetailsCard, StakeDetailsCard } from '@features/stake';
import {
    isRpcParsedBatchInstruction,
    isTokenBatchInstruction,
    RpcParsedTokenBatchCard,
    TokenBatchCard,
} from '@features/token-batch';
import { VoteDetailsCard } from '@features/vote';
import { MPL_TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails, useTransactionStatus } from '@providers/transactions';
import { useFetchTransactionDetails } from '@providers/transactions/parsed';
import {
    ParsedInnerInstruction,
    ParsedInstruction,
    ParsedTransaction,
    PartiallyDecodedInstruction,
    SignatureResult,
    TransactionSignature,
} from '@solana/web3.js';
import { SignatureProps } from '@utils/index';
import { intoTransactionInstruction } from '@utils/tx';
import dynamic from 'next/dynamic';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Programs decoded by name only. `programName` overrides the registry name in the card title.
const NAME_ONLY_PROGRAMS: Partial<Record<ParserProgramLabel, { programName?: string }>> = {
    genesis: {},
    mango: {},
    'token-swap': { programName: 'Token Swap' },
    wormhole: { programName: 'Wormhole' },
};

// The PMP card carries the generated client plus pako/yaml/smol-toml (~35 kB gzip), which only a transaction that
// actually touches the program needs. `isProgramMetadataInstruction` comes from the light `/detection` entry so
// the branch above can stay static.
const PmpDetailsCard = dynamic(() => import('@features/decode-instruction-pmp').then(mod => mod.PmpDetailsCard), {
    loading: () => <LoadingCard />,
    ssr: false,
});

export function InstructionsSection({ signature }: SignatureProps) {
    const status = useTransactionStatus(signature);
    const details = useTransactionDetails(signature);
    const { cluster } = useCluster();
    const fetchDetails = useFetchTransactionDetails();
    const refreshDetails = () => fetchDetails(signature);

    const result = status?.data?.info?.result;
    const transactionWithMeta = details?.data?.transactionWithMeta;
    if (!result || !transactionWithMeta) {
        return <ErrorCard retry={refreshDetails} text="No instructions found" />;
    }
    const { meta, transaction } = transactionWithMeta;

    if (transaction.message.instructions.length === 0) {
        return <ErrorCard retry={refreshDetails} text="No instructions found" />;
    }

    const innerInstructions: {
        [index: number]: (ParsedInstruction | PartiallyDecodedInstruction)[];
    } = {};

    const trusted = trustedInnerInstructions(meta?.innerInstructions, { cluster, slot: transactionWithMeta.slot });
    if (trusted) {
        trusted.forEach((parsed: ParsedInnerInstruction) => {
            if (!innerInstructions[parsed.index]) {
                innerInstructions[parsed.index] = [];
            }

            parsed.instructions.forEach(ix => {
                innerInstructions[parsed.index].push(ix);
            });
        });
    }

    return (
        <CollapsibleSection id="programs" title="Programs" className="">
            <TxInstructionSurface result={result} signature={signature}>
                <React.Suspense fallback={<LoadingCard message="Loading Instructions" />}>
                    {transaction.message.instructions.map((instruction, index) => {
                        const innerCards: JSX.Element[] = [];

                        if (index in innerInstructions) {
                            innerInstructions[index].forEach((ix, childIndex) => {
                                const res = (
                                    <ErrorBoundary
                                        key={`${index}-${childIndex}`}
                                        fallback={
                                            <InnerCardFallback
                                                ix={ix}
                                                tx={transaction}
                                                index={index}
                                                childIndex={childIndex}
                                            />
                                        }
                                    >
                                        <InstructionCard
                                            index={index}
                                            ix={ix}
                                            result={result}
                                            signature={signature}
                                            tx={transaction}
                                            childIndex={childIndex}
                                        />
                                    </ErrorBoundary>
                                );
                                innerCards.push(res);
                            });
                        }

                        return (
                            <InstructionCard
                                key={`${index}`}
                                index={index}
                                ix={instruction}
                                result={result}
                                signature={signature}
                                tx={transaction}
                                innerCards={innerCards}
                            />
                        );
                    })}
                </React.Suspense>
            </TxInstructionSurface>
        </CollapsibleSection>
    );
}

function InnerCardFallback({
    ix,
    tx,
    index,
    childIndex,
}: {
    ix: ParsedInstruction | PartiallyDecodedInstruction;
    tx: ParsedTransaction;
    index: number;
    childIndex: number;
}) {
    const fallbackIx = 'parsed' in ix ? ix : intoTransactionInstruction(tx, ix);
    if (!fallbackIx) {
        return <ErrorCard text="Could not display this instruction, please report" />;
    }
    return <UnknownDetailsCard node={toInstructionNode({ childIndex, index, ix: fallbackIx })} />;
}

function InstructionCard({
    ix,
    tx,
    result,
    index,
    signature,
    innerCards,
    childIndex,
}: {
    ix: ParsedInstruction | PartiallyDecodedInstruction;
    tx: ParsedTransaction;
    result: SignatureResult;
    index: number;
    signature: TransactionSignature;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const key = `${index}-${childIndex}`;
    const dispatcher = useInstructionParser();

    const parsedIx = React.useMemo(
        () => ('parsed' in ix ? dispatcher.fromParsedInstruction(ix) : undefined),
        [dispatcher, ix],
    );

    // Raw form is needed by both the native tiers below and the dynamic IDL tier; `intoTransactionInstruction`
    // returns undefined for RPC-pre-parsed instructions. Lifted above the early returns so the hooks order
    // stays stable.
    const transactionIx = React.useMemo(() => intoTransactionInstruction(tx, ix), [tx, ix]);
    // Dynamic IDL tier — shared with the inspector. See app/components/inspector/InstructionsSection.tsx.
    // Memoized so the Anchor Program / Borsh coder isn't rebuilt on every re-render.
    const idlDecode = useIdlInstructionDecode({ programId: ix.programId.toString(), raw: transactionIx });

    if ('parsed' in ix && parsedIx) {
        const props = {
            childIndex,
            index,
            innerCards,
            ix: parsedIx,
            result,
            tx,
        };
        const node = toInstructionNode({ childIndex, index, innerCards, ix: parsedIx });

        switch (ix.program) {
            case SPL_TOKEN_PROGRAM_LABEL:
            case SPL_TOKEN_2022_PROGRAM_LABEL: {
                // The RPC parses batch instructions (disc 0xff) as ParsedInstruction
                // with type "batch". Route them to the batch card before TokenDetailsCard
                // throws on the unrecognised type.
                if (isRpcParsedBatchInstruction(ix.parsed)) {
                    return (
                        <ErrorBoundary fallback={<UnknownDetailsCard node={node} />} key={key}>
                            <RpcParsedTokenBatchCard
                                ix={ix}
                                index={index}
                                innerCards={innerCards}
                                childIndex={childIndex}
                            />
                        </ErrorBoundary>
                    );
                }
                return (
                    <ErrorBoundary fallback={<UnknownDetailsCard node={node} />} key={key}>
                        <TokenDetailsCard ix={parsedIx} index={index} innerCards={innerCards} childIndex={childIndex} />
                    </ErrorBoundary>
                );
            }
            case BPF_LOADER_PROGRAM_LABEL:
                return (
                    <BpfLoaderDetailsCard
                        key={key}
                        ix={parsedIx}
                        index={index}
                        innerCards={innerCards}
                        childIndex={childIndex}
                    />
                );
            case BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL:
                return <BpfUpgradeableLoaderDetailsCard {...props} key={key} />;
            case SYSTEM_PROGRAM_LABEL:
                return <SystemDetailsCard {...props} key={key} />;
            case STAKE_PROGRAM_LABEL:
                return <StakeDetailsCard {...props} key={key} />;
            case SPL_MEMO_PROGRAM_LABEL:
                return (
                    <MemoDetailsCard
                        key={key}
                        ix={parsedIx}
                        index={index}
                        innerCards={innerCards}
                        childIndex={childIndex}
                    />
                );
            case SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_LABEL:
                return (
                    <AssociatedTokenDetailsCard
                        key={key}
                        ix={parsedIx}
                        index={index}
                        innerCards={innerCards}
                        childIndex={childIndex}
                    />
                );
            case VOTE_PROGRAM_LABEL:
                return <VoteDetailsCard {...props} key={key} />;
            case ADDRESS_LOOKUP_TABLE_PROGRAM_LABEL:
                return (
                    <AddressLookupTableDetailsCard
                        key={key}
                        ix={parsedIx}
                        index={index}
                        innerCards={innerCards}
                        childIndex={childIndex}
                    />
                );
            default:
                return <UnknownDetailsCard node={node} key={key} />;
        }
    }

    if (!transactionIx) {
        return <ErrorCard key={key} text="Could not display this instruction, please report" />;
    }

    const nodeProps = { childIndex, index, innerCards, ix: transactionIx };
    const props = { ...nodeProps, result, signature };
    const node = toInstructionNode(nodeProps);

    if (isEd25519Instruction(transactionIx)) {
        const dispatched = dispatcher.fromTransactionInstruction(transactionIx);
        if (dispatched) {
            return (
                <Ed25519DetailsCard
                    key={key}
                    ix={dispatched}
                    raw={transactionIx}
                    siblingData={siblingDataFromParsedTransaction(tx)}
                    index={index}
                    innerCards={innerCards}
                    childIndex={childIndex}
                />
            );
        }
        return <UnknownDetailsCard key={key} node={node} />;
    }
    const programLabel = dispatcher.getInstructionParser(transactionIx.programId.toBase58())?.programLabel;
    const nameOnly = programLabel && NAME_ONLY_PROGRAMS[programLabel];
    if (nameOnly || programLabel === SERUM_PROGRAM_LABEL) {
        const dispatched = dispatcher.fromTransactionInstruction(transactionIx);
        if (!dispatched) {
            return <UnknownDetailsCard key={key} node={node} />;
        }
        if (nameOnly) {
            return (
                <NameOnlyDetailsCard
                    key={key}
                    node={node}
                    name={isParsedInstruction(dispatched) ? dispatched.parsed.type : undefined}
                    programName={nameOnly.programName}
                />
            );
        }
        return (
            <ErrorBoundary fallback={<UnknownDetailsCard node={node} />} key={key}>
                <SerumDetailsCard
                    ix={dispatched}
                    raw={transactionIx}
                    index={index}
                    innerCards={innerCards}
                    childIndex={childIndex}
                />
            </ErrorBoundary>
        );
    }
    if (isPythProgramId(transactionIx.programId.toBase58())) {
        const dispatched = dispatcher.fromTransactionInstruction(transactionIx);
        if (!dispatched) {
            return <UnknownDetailsCard key={key} node={node} />;
        }
        return (
            <PythDetailsCard
                key={key}
                ix={dispatched}
                raw={transactionIx}
                index={index}
                innerCards={innerCards}
                childIndex={childIndex}
            />
        );
    }
    if (isComputeBudgetInstruction(transactionIx)) {
        const dispatched = dispatcher.fromTransactionInstruction(transactionIx);
        if (dispatched) {
            return (
                <ComputeBudgetDetailsCard
                    key={key}
                    ix={dispatched}
                    raw={transactionIx}
                    index={index}
                    innerCards={innerCards}
                    childIndex={childIndex}
                />
            );
        }
        return <UnknownDetailsCard key={key} node={node} />;
    }
    if (isZkElGamalProofInstruction(transactionIx)) {
        const dispatched = dispatcher.fromTransactionInstruction(transactionIx);
        if (dispatched) {
            return (
                <ZkElGamalProofDetailsCard
                    key={key}
                    ix={dispatched}
                    raw={transactionIx}
                    index={index}
                    innerCards={innerCards}
                    childIndex={childIndex}
                />
            );
        }
        return <UnknownDetailsCard key={key} node={node} />;
    }
    if (isLighthouseInstruction(transactionIx)) {
        const dispatched = dispatcher.fromTransactionInstruction(transactionIx);
        if (isParsedInstruction(dispatched)) {
            return (
                <ErrorBoundary fallback={<UnknownDetailsCard node={node} />} key={key}>
                    <LighthouseDetailsCard
                        ix={dispatched}
                        raw={transactionIx}
                        index={index}
                        innerCards={innerCards}
                        childIndex={childIndex}
                    />
                </ErrorBoundary>
            );
        }
        return <UnknownDetailsCard key={key} node={node} />;
    }
    if (isStakeInstruction(transactionIx)) {
        return <RawStakeDetailsCard key={key} {...props} />;
    }
    if (isTokenBatchInstruction(transactionIx)) {
        return (
            <ErrorBoundary fallback={<UnknownDetailsCard node={node} />} key={key}>
                <TokenBatchCard {...nodeProps} />
            </ErrorBoundary>
        );
    }
    if (isSolanaAttestationInstruction(transactionIx)) {
        const dispatched = dispatcher.fromTransactionInstruction(transactionIx);
        if (dispatched) {
            return (
                <ErrorBoundary fallback={<UnknownDetailsCard node={node} />} key={key}>
                    <SolanaAttestationDetailsCard
                        ix={dispatched}
                        raw={transactionIx}
                        index={index}
                        innerCards={innerCards}
                        childIndex={childIndex}
                    />
                </ErrorBoundary>
            );
        }
        return <UnknownDetailsCard key={key} node={node} />;
    }
    if (transactionIx.programId.toBase58() === MPL_TOKEN_METADATA_PROGRAM_ID) {
        const dispatched = dispatcher.fromTransactionInstruction(transactionIx);
        if (dispatched) {
            return (
                <ErrorBoundary fallback={<UnknownDetailsCard node={node} />} key={key}>
                    <MetaplexTokenMetadataDetailsCard
                        ix={dispatched}
                        raw={transactionIx}
                        index={index}
                        innerCards={innerCards}
                        childIndex={childIndex}
                    />
                </ErrorBoundary>
            );
        }
        return <UnknownDetailsCard key={key} node={node} />;
    }
    // PMP owns every instruction on its program id: `setData`/`initialize`/`write` render decoded content from
    // the bundled typed decoders (no IDL needed), and the housekeeping instructions delegate to the IDL tier
    // from inside the card. Must sit before the generic idlDecode tier so it wins for the content instructions.
    if (isProgramMetadataInstruction(transactionIx)) {
        return (
            <PmpDetailsCard
                key={key}
                {...nodeProps}
                // The card cannot import the IDL feature (boundaries/dependencies), so this surface decides what
                // a non-content PMP instruction falls back to. Same two outcomes as before the branch existed.
                fallback={
                    idlDecode ? (
                        <IdlInstructionCard decoded={idlDecode} {...nodeProps} />
                    ) : (
                        <UnknownDetailsCard node={node} />
                    )
                }
            />
        );
    }
    if (idlDecode) {
        return <IdlInstructionCard key={key} decoded={idlDecode} {...nodeProps} />;
    }

    return <UnknownDetailsCard key={key} node={node} />;
}

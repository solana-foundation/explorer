import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { AddressLookupTableDetailsCard } from '@components/instruction/AddressLookupTableDetailsCard';
import { AssociatedTokenDetailsCard } from '@components/instruction/associated-token/AssociatedTokenDetailsCard';
import { BpfLoaderDetailsCard } from '@components/instruction/bpf-loader/BpfLoaderDetailsCard';
import { BpfUpgradeableLoaderDetailsCard } from '@components/instruction/bpf-upgradeable-loader/BpfUpgradeableLoaderDetailsCard';
import { ComputeBudgetDetailsCard } from '@components/instruction/ComputeBudgetDetailsCard';
import { Ed25519DetailsCard } from '@components/instruction/ed25519/Ed25519DetailsCard';
import { isEd25519Instruction } from '@components/instruction/ed25519/types';
import { MemoDetailsCard } from '@components/instruction/MemoDetailsCard';
import { PythDetailsCard } from '@components/instruction/pyth/PythDetailsCard';
import { isPythInstruction } from '@components/instruction/pyth/types';
import {
    isSolanaAttestationInstruction,
    SolanaAttestationDetailsCard,
} from '@components/instruction/sas/SolanaAttestationDetailsCard';
import { SystemDetailsCard } from '@components/instruction/system/SystemDetailsCard';
import { TokenDetailsCard } from '@components/instruction/token/TokenDetailsCard';
import { isTokenLendingInstruction } from '@components/instruction/token-lending/types';
import { isTokenSwapInstruction } from '@components/instruction/token-swap/types';
import { TokenLendingDetailsCard } from '@components/instruction/TokenLendingDetailsCard';
import { TokenSwapDetailsCard } from '@components/instruction/TokenSwapDetailsCard';
import { UnknownDetailsCard } from '@components/instruction/UnknownDetailsCard';
import { isWormholeInstruction } from '@components/instruction/wormhole/types';
import { WormholeDetailsCard } from '@components/instruction/WormholeDetailsCard';
import { ZkElGamalProofDetailsCard } from '@components/instruction/ZkElGamalProofDetailsCard';
import { isParsedInstruction, useInstructionParser } from '@entities/instruction-parser';
import { isZkElGamalProofInstruction } from '@entities/zk-elgamal-proof';
import { getMangoInstructionLabel, isMangoInstruction } from '@explorer/decoder-mango/detection';
import {
    getSerumInstructionLabel,
    isDeprecatedSerumProgram,
    isSerumInstruction,
} from '@explorer/decoder-serum/detection';
import { isLighthouseInstruction, LighthouseDetailsCard } from '@features/decode-instruction-lighthouse';
import { IdlInstructionCard, useIdlInstructionDecode } from '@features/decode-instruction-with-idl';
import { MetaplexTokenMetadataDetailsCard } from '@features/mpl-token-metadata';
import { isStakeInstruction, RawStakeDetailsCard, StakeDetailsCard } from '@features/stake';
import { isTokenBatchInstruction, TokenBatchCard } from '@features/token-batch';
import { VoteDetailsCard } from '@features/vote';
import { MPL_TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails, useTransactionStatus } from '@providers/transactions';
import { useFetchTransactionDetails } from '@providers/transactions/parsed';
import {
    ComputeBudgetProgram,
    ParsedInnerInstruction,
    ParsedInstruction,
    ParsedTransaction,
    PartiallyDecodedInstruction,
    SignatureResult,
    TransactionSignature,
} from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { INNER_INSTRUCTIONS_START_SLOT, SignatureProps } from '@utils/index';
import { intoTransactionInstruction } from '@utils/tx';
import dynamic from 'next/dynamic';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { CollapsibleSection } from './CollapsibleSection';
import { CommonInstructionDetailsCard } from './CommonInstructionDetailsCard';

const SerumDetailsCard = dynamic(
    () => import('@features/instruction-program-serum').then(mod => mod.SerumDetailsCard),
    { ssr: false },
);

export type InstructionDetailsProps = {
    tx: ParsedTransaction;
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

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

    if (
        meta?.innerInstructions &&
        (cluster !== Cluster.MainnetBeta || transactionWithMeta.slot >= INNER_INSTRUCTIONS_START_SLOT)
    ) {
        meta.innerInstructions.forEach((parsed: ParsedInnerInstruction) => {
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
            <React.Suspense fallback={<LoadingCard message="Loading Instructions" />}>
                {transaction.message.instructions.map((instruction, index) => {
                    const innerCards: JSX.Element[] = [];

                    if (index in innerInstructions) {
                        innerInstructions[index].forEach((ix, childIndex) => {
                            const res = (
                                <InstructionCard
                                    key={`${index}-${childIndex}`}
                                    index={index}
                                    ix={ix}
                                    result={result}
                                    signature={signature}
                                    tx={transaction}
                                    childIndex={childIndex}
                                />
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
        </CollapsibleSection>
    );
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

        switch (ix.program) {
            case 'spl-token':
            case 'spl-token-2022':
                return (
                    <ErrorBoundary fallback={<UnknownDetailsCard {...props} />} key={key}>
                        <TokenDetailsCard {...props} key={key} />
                    </ErrorBoundary>
                );
            case 'bpf-loader':
                return <BpfLoaderDetailsCard {...props} key={key} />;
            case 'bpf-upgradeable-loader':
                return <BpfUpgradeableLoaderDetailsCard {...props} key={key} />;
            case 'system':
                return <SystemDetailsCard {...props} key={key} />;
            case 'stake':
                return <StakeDetailsCard {...props} key={key} />;
            case 'spl-memo':
                return <MemoDetailsCard {...props} key={key} />;
            case 'spl-associated-token-account':
                return <AssociatedTokenDetailsCard {...props} key={key} />;
            case 'vote':
                return <VoteDetailsCard {...props} key={key} />;
            case 'address-lookup-table':
                return <AddressLookupTableDetailsCard {...props} key={key} />;
            default:
                return <UnknownDetailsCard {...props} key={key} />;
        }
    }

    if (!transactionIx) {
        return <ErrorCard key={key} text="Could not display this instruction, please report" />;
    }

    const props = {
        childIndex,
        index,
        innerCards,
        ix: transactionIx,
        result,
        signature,
    };

    if (isEd25519Instruction(transactionIx)) {
        return <Ed25519DetailsCard key={key} {...props} tx={tx} />;
    }
    if (isMangoInstruction(transactionIx)) {
        return (
            <CommonInstructionDetailsCard
                key={key}
                {...props}
                instructionName={getMangoInstructionLabel(transactionIx)}
            />
        );
    }
    if (isSerumInstruction(transactionIx)) {
        // Dead Serum DEX deployments get the generic name-only card; the active OpenBook fork keeps full decoding.
        if (isDeprecatedSerumProgram(transactionIx.programId.toBase58())) {
            return (
                <CommonInstructionDetailsCard
                    key={key}
                    {...props}
                    instructionName={getSerumInstructionLabel(transactionIx)}
                />
            );
        }
        return (
            <ErrorBoundary fallback={<UnknownDetailsCard {...props} />} key={key}>
                <SerumDetailsCard {...props} />
            </ErrorBoundary>
        );
    }
    if (isTokenSwapInstruction(transactionIx)) {
        return <TokenSwapDetailsCard key={key} {...props} />;
    }
    if (isTokenLendingInstruction(transactionIx)) {
        return <TokenLendingDetailsCard key={key} {...props} />;
    }
    if (isWormholeInstruction(transactionIx)) {
        return <WormholeDetailsCard key={key} {...props} />;
    }
    if (isPythInstruction(transactionIx)) {
        return <PythDetailsCard key={key} {...props} />;
    }
    if (ComputeBudgetProgram.programId.equals(transactionIx.programId)) {
        return <ComputeBudgetDetailsCard key={key} {...props} />;
    }
    if (isZkElGamalProofInstruction(transactionIx)) {
        return <ZkElGamalProofDetailsCard key={key} {...props} />;
    }
    if (isLighthouseInstruction(transactionIx)) {
        const dispatched = dispatcher.fromTransactionInstruction(transactionIx);
        if (isParsedInstruction(dispatched)) {
            return (
                <LighthouseDetailsCard
                    key={key}
                    ix={dispatched}
                    raw={transactionIx}
                    index={index}
                    result={result}
                    innerCards={innerCards}
                    childIndex={childIndex}
                />
            );
        }
        return <UnknownDetailsCard key={key} {...props} />;
    }
    if (isStakeInstruction(transactionIx)) {
        return <RawStakeDetailsCard key={key} {...props} />;
    }
    if (isTokenBatchInstruction(transactionIx)) {
        return (
            <ErrorBoundary fallback={<UnknownDetailsCard {...props} />} key={key}>
                <TokenBatchCard {...props} />
            </ErrorBoundary>
        );
    }
    if (isSolanaAttestationInstruction(transactionIx)) {
        return (
            <ErrorBoundary fallback={<UnknownDetailsCard {...props} />} key={key}>
                <SolanaAttestationDetailsCard {...props} />
            </ErrorBoundary>
        );
    }
    if (transactionIx.programId.toBase58() === MPL_TOKEN_METADATA_PROGRAM_ID) {
        return (
            <ErrorBoundary fallback={<UnknownDetailsCard {...props} />} key={key}>
                <MetaplexTokenMetadataDetailsCard {...props} />
            </ErrorBoundary>
        );
    }
    if (idlDecode) {
        return <IdlInstructionCard key={key} decoded={idlDecode} {...props} />;
    }

    return <UnknownDetailsCard key={key} {...props} />;
}

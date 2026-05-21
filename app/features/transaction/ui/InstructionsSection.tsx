import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { AddressLookupTableDetailsCard } from '@components/instruction/AddressLookupTableDetailsCard';
import AnchorDetailsCard from '@components/instruction/AnchorDetailsCard';
import { AssociatedTokenDetailsCard } from '@components/instruction/associated-token/AssociatedTokenDetailsCard';
import { BpfLoaderDetailsCard } from '@components/instruction/bpf-loader/BpfLoaderDetailsCard';
import { BpfUpgradeableLoaderDetailsCard } from '@components/instruction/bpf-upgradeable-loader/BpfUpgradeableLoaderDetailsCard';
import { ComputeBudgetDetailsCard } from '@components/instruction/ComputeBudgetDetailsCard';
import { Ed25519DetailsCard } from '@components/instruction/ed25519/Ed25519DetailsCard';
import { isEd25519Instruction } from '@components/instruction/ed25519/types';
import { LighthouseDetailsCard } from '@components/instruction/lighthouse/LighthouseDetailsCard';
import { isLighthouseInstruction } from '@components/instruction/lighthouse/types';
import { isMangoInstruction } from '@components/instruction/mango/types';
import { MangoDetailsCard } from '@components/instruction/MangoDetails';
import { MemoDetailsCard } from '@components/instruction/MemoDetailsCard';
import { ProgramMetadataIdlInstructionDetailsCard } from '@components/instruction/program-metadata-idl/ProgramMetadataIdlInstructionDetailsCard';
import { PythDetailsCard } from '@components/instruction/pyth/PythDetailsCard';
import { isPythInstruction } from '@components/instruction/pyth/types';
import {
    isSolanaAttestationInstruction,
    SolanaAttestationDetailsCard,
} from '@components/instruction/sas/SolanaAttestationDetailsCard';
import { isSerumInstruction } from '@components/instruction/serum/types';
import { SerumDetailsCard } from '@components/instruction/SerumDetailsCard';
import { SystemDetailsCard } from '@components/instruction/system/SystemDetailsCard';
import { TokenDetailsCard } from '@components/instruction/token/TokenDetailsCard';
import { isTokenLendingInstruction } from '@components/instruction/token-lending/types';
import { isTokenSwapInstruction } from '@components/instruction/token-swap/types';
import { TokenLendingDetailsCard } from '@components/instruction/TokenLendingDetailsCard';
import { TokenSwapDetailsCard } from '@components/instruction/TokenSwapDetailsCard';
import { UnknownDetailsCard } from '@components/instruction/UnknownDetailsCard';
import { VoteDetailsCard } from '@components/instruction/vote/VoteDetailsCard';
import { isWormholeInstruction } from '@components/instruction/wormhole/types';
import { WormholeDetailsCard } from '@components/instruction/WormholeDetailsCard';
import {
    isZkElGamalProofInstruction,
    ZkElGamalProofDetailsCard,
} from '@components/instruction/ZkElGamalProofDetailsCard';
import { useAnchorProgram } from '@entities/idl';
import { useInstructionParser } from '@entities/instruction-parser';
import { MetaplexTokenMetadataDetailsCard } from '@features/mpl-token-metadata';
import { isStakeInstruction, RawStakeDetailsCard, StakeDetailsCard } from '@features/stake';
import { isTokenBatchInstruction, TokenBatchCard } from '@features/token-batch';
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
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { useProgramMetadataIdl } from '@/app/entities/program-metadata';

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
    const { cluster, url } = useCluster();
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
        <>
            <div className='e-mb-3'>
                <h2 className="e-m-0 e-text-lg e-font-normal e-text-white">Programs</h2>
            </div>
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
                                    url={url}
                                    cluster={cluster}
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
                            url={url}
                            cluster={cluster}
                        />
                    );
                })}
            </React.Suspense>
        </>
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
    url,
    cluster,
}: {
    ix: ParsedInstruction | PartiallyDecodedInstruction;
    tx: ParsedTransaction;
    result: SignatureResult;
    index: number;
    signature: TransactionSignature;
    innerCards?: JSX.Element[];
    childIndex?: number;
    url: string;
    cluster: Cluster;
}) {
    const key = `${index}-${childIndex}`;
    const { program: anchorProgram } = useAnchorProgram(ix.programId.toString(), url, cluster);
    const { programMetadataIdl } = useProgramMetadataIdl(ix.programId.toString(), url, cluster);
    const dispatcher = useInstructionParser();

    const parsedIx = React.useMemo(
        () => ('parsed' in ix ? dispatcher.fromParsedInstruction(ix) : undefined),
        [dispatcher, ix],
    );

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

    const transactionIx = intoTransactionInstruction(tx, ix);

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
        return <MangoDetailsCard key={key} {...props} />;
    }
    if (isSerumInstruction(transactionIx)) {
        return <SerumDetailsCard key={key} {...props} />;
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
        return <LighthouseDetailsCard key={key} {...props} />;
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
    if (programMetadataIdl) {
        return <ProgramMetadataIdlInstructionDetailsCard key={key} {...props} idl={programMetadataIdl} />;
    }
    if (anchorProgram) {
        return (
            <ErrorBoundary fallback={<UnknownDetailsCard {...props} />} key={key}>
                <AnchorDetailsCard anchorProgram={anchorProgram} {...props} />
            </ErrorBoundary>
        );
    }

    return <UnknownDetailsCard key={key} {...props} />;
}

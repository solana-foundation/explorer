import { LoadingCard } from '@components/common/LoadingCard';
import { BpfUpgradeableLoaderDetailsCard } from '@components/instruction/bpf-upgradeable-loader/BpfUpgradeableLoaderDetailsCard';
import { SystemDetailsCard } from '@components/instruction/system/SystemDetailsCard';
import { TokenDetailsCard } from '@components/instruction/token/TokenDetailsCard';
import {
    type InstructionNode,
    NameOnlyDetailsCard,
    toInstructionNode,
    UnknownDetailsCard,
    useInstructionSurface,
} from '@entities/instruction-card';
import {
    type DispatchResult,
    isParsedInstruction,
    type ParserProgramLabel,
    useInstructionParser,
} from '@entities/instruction-parser';
import type { STAKE_PROGRAM_LABEL, VOTE_PROGRAM_LABEL } from '@explorer/parsers';
import { AddressLookupTableDetailsCard } from '@features/decode-instruction-address-lookup-table';
import { AssociatedTokenDetailsCard } from '@features/decode-instruction-associated-token';
import { BpfLoaderDetailsCard } from '@features/decode-instruction-bpf-loader';
import { ComputeBudgetDetailsCard } from '@features/decode-instruction-compute-budget';
import { Ed25519DetailsCard } from '@features/decode-instruction-ed25519';
import { LighthouseDetailsCard } from '@features/decode-instruction-lighthouse';
import { MemoDetailsCard } from '@features/decode-instruction-memo';
import { isProgramMetadataInstruction } from '@features/decode-instruction-pmp/detection';
import { SolanaAttestationDetailsCard } from '@features/decode-instruction-sas';
import { IdlInstructionCard, useIdlInstructionDecode } from '@features/decode-instruction-with-idl';
import { ZkElGamalProofDetailsCard } from '@features/decode-instruction-zk-elgamal-proof';
import { PythDetailsCard } from '@features/instruction-program-pyth';
import { SerumDetailsCard } from '@features/instruction-program-serum';
import { MetaplexTokenMetadataDetailsCard } from '@features/mpl-token-metadata';
import { isStakeInstruction, RawStakeDetailsCard, StakeDetailsCard } from '@features/stake';
import {
    isRpcParsedBatchInstruction,
    isTokenBatchInstruction,
    RpcParsedTokenBatchCard,
    TokenBatchCard,
} from '@features/token-batch';
import { VoteDetailsCard } from '@features/vote';
import type { ParsedInstruction, TransactionInstruction } from '@solana/web3.js';
import dynamic from 'next/dynamic';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// The PMP card carries the generated client plus pako/yaml/smol-toml (~35 kB gzip), which only a transaction that
// actually touches the program needs. `isProgramMetadataInstruction` comes from the light `/detection` entry so
// the branch below can stay static.
const PmpDetailsCard = dynamic(() => import('@features/decode-instruction-pmp').then(mod => mod.PmpDetailsCard), {
    loading: () => <LoadingCard />,
    ssr: false,
});

export function InstructionNodeCard({ node }: { node: InstructionNode }) {
    return (
        <ErrorBoundary resetKeys={[node]} fallback={<UnknownDetailsCard node={node} />}>
            <ProgramCard node={node} />
        </ErrorBoundary>
    );
}

function ProgramCard({ node }: { node: InstructionNode }) {
    const dispatcher = useInstructionParser();
    const { instructionData } = useInstructionSurface();
    const raw = 'parsed' in node.ix ? undefined : node.ix;
    const dispatched = React.useMemo(
        () =>
            'parsed' in node.ix
                ? dispatcher.fromParsedInstruction(node.ix)
                : dispatcher.fromTransactionInstruction(node.ix),
        [dispatcher, node.ix],
    );
    const idlDecode = useIdlInstructionDecode({ programId: node.programId.toBase58(), raw });
    const fallback =
        raw && idlDecode ? (
            <IdlInstructionCard node={node} ix={raw} decoded={idlDecode} />
        ) : (
            <UnknownDetailsCard node={node} />
        );

    // PMP content instructions decode without an IDL, so the PMP card must come before the IDL card.
    if (raw && isProgramMetadataInstruction(raw)) {
        return <PmpDetailsCard node={node} ix={raw} fallback={fallback} />;
    }
    if (raw && isStakeInstruction(raw)) {
        return <RawStakeDetailsCard node={node} ix={raw} fallback={fallback} />;
    }
    const card = dispatched && PROGRAM_CARDS[programLabel(dispatched)]?.({ dispatched, instructionData, node, raw });
    return card ?? fallback;
}

type ProgramRoute = (route: {
    node: InstructionNode;
    dispatched: DispatchResult;
    raw: TransactionInstruction | undefined;
    instructionData: (index: number) => Uint8Array | undefined;
}) => React.ReactElement | undefined;

type CardProgramLabel = ParserProgramLabel | typeof STAKE_PROGRAM_LABEL | typeof VOTE_PROGRAM_LABEL;

/** A route that returns `undefined` passes the instruction to the IDL card. */
const PROGRAM_CARDS: Readonly<Record<string, ProgramRoute | undefined>> = {
    'address-lookup-table': decoded(AddressLookupTableDetailsCard),
    'bpf-loader': decoded(BpfLoaderDetailsCard),
    'bpf-upgradeable-loader': decoded(BpfUpgradeableLoaderDetailsCard),
    'compute-budget': ({ node, dispatched }) => <ComputeBudgetDetailsCard node={node} ix={dispatched} />,
    ed25519: ({ node, dispatched, raw, instructionData }) =>
        raw && <Ed25519DetailsCard node={{ ...node, raw }} ix={dispatched} siblingData={instructionData} />,
    lighthouse: ({ node, dispatched, raw }) =>
        raw && isParsedInstruction(dispatched) ? (
            <LighthouseDetailsCard node={{ ...node, raw }} ix={dispatched} />
        ) : undefined,
    mango: nameOnly(),
    'mpl-token-metadata': ({ node, dispatched }) => <MetaplexTokenMetadataDetailsCard node={node} ix={dispatched} />,
    pyth: ({ node, dispatched }) => <PythDetailsCard node={node} ix={dispatched} />,
    serum: ({ node, dispatched }) => <SerumDetailsCard node={node} ix={dispatched} />,
    'solana-attestation-service': ({ node, dispatched, raw }) =>
        raw && <SolanaAttestationDetailsCard node={{ ...node, raw }} ix={dispatched} />,
    'spl-associated-token-account': decoded(AssociatedTokenDetailsCard),
    'spl-memo': decoded(MemoDetailsCard),
    'spl-token': tokenCard,
    'spl-token-2022': tokenCard,
    stake: decoded(StakeDetailsCard),
    system: decoded(SystemDetailsCard),
    'token-swap': nameOnly('Token Swap'),
    vote: decoded(VoteDetailsCard),
    wormhole: nameOnly('Wormhole'),
    'zk-elgamal-proof': ({ node, dispatched }) => <ZkElGamalProofDetailsCard node={node} ix={dispatched} />,
} satisfies Partial<Record<CardProgramLabel, ProgramRoute>>;

function programLabel(dispatched: DispatchResult): string {
    return 'unknown' in dispatched ? dispatched.programLabel : dispatched.program;
}

/** The card node holds the dispatch result to show its parsed payload in the Raw view. */
function decoded(Card: React.ComponentType<{ node: InstructionNode; ix: ParsedInstruction }>): ProgramRoute {
    return function decodedRoute({ node, dispatched, raw }) {
        return isParsedInstruction(dispatched) ? (
            <Card node={toInstructionNode({ ...node, ix: dispatched, raw: raw ?? node.raw })} ix={dispatched} />
        ) : undefined;
    };
}

function nameOnly(programName?: string): ProgramRoute {
    return function nameOnlyRoute({ node, dispatched }) {
        return (
            <NameOnlyDetailsCard
                node={node}
                name={isParsedInstruction(dispatched) ? dispatched.parsed.type : undefined}
                programName={programName}
            />
        );
    };
}

function tokenCard(route: Parameters<ProgramRoute>[0]): React.ReactElement | undefined {
    const { node, dispatched, raw } = route;
    if (isParsedInstruction(dispatched) && isRpcParsedBatchInstruction(dispatched.parsed)) {
        return <RpcParsedTokenBatchCard node={node} ix={dispatched} />;
    }
    if (raw && isTokenBatchInstruction(raw)) {
        return <TokenBatchCard node={node} ix={raw} />;
    }
    return decoded(TokenDetailsCard)(route);
}

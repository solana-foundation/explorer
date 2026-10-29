import { BpfUpgradeableLoaderDetailsCard } from '@components/instruction/bpf-upgradeable-loader/BpfUpgradeableLoaderDetailsCard';
import { SystemDetailsCard } from '@components/instruction/system/SystemDetailsCard';
import { TokenDetailsCard } from '@components/instruction/token/TokenDetailsCard';
import {
    type InstructionNode,
    LoadingDetailsCard,
    NameOnlyDetailsCard,
    type RawInstructionNode,
    toInstructionNode,
    toRawInstructionNode,
    UnknownDetailsCard,
    useInstructionSurface,
} from '@entities/instruction-card';
import {
    type DispatchResult,
    isParsedInstruction,
    type ParsedInstructionInfo,
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
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { Logger } from '@/app/shared/lib/logger';

// The PMP card carries the generated client plus pako/yaml/smol-toml (~35 kB gzip), which only a transaction that
// actually touches the program needs. `isProgramMetadataInstruction` comes from the light `/detection` entry so
// the branch below can stay static. `React.lazy` rather than `next/dynamic`, because the fallback needs the node
// to draw the card's frame, and the `loading` option of `next/dynamic` receives the loading state, not the card props.
const PmpDetailsCard = React.lazy(() =>
    import('@features/decode-instruction-pmp').then(mod => ({ default: mod.PmpDetailsCard })),
);

export function InstructionNodeCard({ node }: { node: InstructionNode }) {
    const { signature } = useInstructionSurface();
    return (
        <ErrorBoundary
            resetKeys={[node]}
            fallback={<UnknownDetailsCard node={node} />}
            onError={error =>
                Logger.error(error, {
                    sentry: 'always',
                    sentryExtras: {
                        childIndex: node.childIndex,
                        index: node.index,
                        programId: node.programId.toBase58(),
                        signature,
                    },
                })
            }
        >
            <ProgramCard node={node} />
        </ErrorBoundary>
    );
}

function ProgramCard({ node }: { node: InstructionNode }) {
    const dispatcher = useInstructionParser();
    const { instructionData } = useInstructionSurface();
    const { ix } = node;
    const rawNode = 'parsed' in ix ? undefined : toRawInstructionNode({ ...node, ix });
    const dispatched = React.useMemo(
        () =>
            'parsed' in node.ix
                ? dispatcher.fromParsedInstruction(node.ix)
                : dispatcher.fromTransactionInstruction(node.ix),
        [dispatcher, node.ix],
    );
    const idlDecode = useIdlInstructionDecode({ programId: node.programId.toBase58(), raw: rawNode?.raw });
    const fallback =
        rawNode && idlDecode ? (
            <IdlInstructionCard node={rawNode} decoded={idlDecode} />
        ) : (
            <UnknownDetailsCard node={node} />
        );

    // PMP content instructions decode without an IDL, so the PMP card must come before the IDL card.
    if (rawNode && isProgramMetadataInstruction(rawNode.raw)) {
        return (
            <React.Suspense fallback={<LoadingDetailsCard node={rawNode} />}>
                <PmpDetailsCard node={rawNode} fallback={fallback} />
            </React.Suspense>
        );
    }
    if (rawNode && isStakeInstruction(rawNode.raw)) {
        return <RawStakeDetailsCard node={rawNode} fallback={fallback} />;
    }
    const card = dispatched && programRoute(dispatched)?.({ dispatched, instructionData, node, rawNode });
    return card ?? fallback;
}

type ProgramRoute = (route: {
    node: InstructionNode;
    dispatched: DispatchResult;
    rawNode: RawInstructionNode | undefined;
    instructionData: (index: number) => Uint8Array | undefined;
}) => React.ReactElement | undefined;

type CardProgramLabel = ParserProgramLabel | typeof STAKE_PROGRAM_LABEL | typeof VOTE_PROGRAM_LABEL;

/** A route that returns `undefined` renders the fallback: the IDL card when an IDL decodes the bytes, else Unknown. */
const PROGRAM_CARDS: Readonly<Record<string, ProgramRoute | undefined>> = {
    'address-lookup-table': decoded(AddressLookupTableDetailsCard),
    'bpf-loader': decoded(BpfLoaderDetailsCard),
    'bpf-upgradeable-loader': decoded(BpfUpgradeableLoaderDetailsCard),
    'compute-budget': ({ node, dispatched, rawNode }) =>
        rawNode && <ComputeBudgetDetailsCard node={node} parsed={parsedOf(dispatched)} />,
    ed25519: ({ dispatched, rawNode, instructionData }) =>
        rawNode && <Ed25519DetailsCard node={rawNode} parsed={parsedOf(dispatched)} siblingData={instructionData} />,
    lighthouse: ({ dispatched, rawNode }) =>
        rawNode && isParsedInstruction(dispatched) ? (
            <LighthouseDetailsCard node={rawNode} parsed={dispatched.parsed} />
        ) : undefined,
    mango: nameOnly(),
    'mpl-token-metadata': ({ node, dispatched, rawNode }) =>
        rawNode && <MetaplexTokenMetadataDetailsCard node={node} parsed={parsedOf(dispatched)} />,
    pyth: ({ node, dispatched, rawNode }) => rawNode && <PythDetailsCard node={node} parsed={parsedOf(dispatched)} />,
    serum: ({ node, dispatched, rawNode }) => rawNode && <SerumDetailsCard node={node} parsed={parsedOf(dispatched)} />,
    'solana-attestation-service': ({ dispatched, rawNode }) =>
        rawNode && <SolanaAttestationDetailsCard node={rawNode} parsed={parsedOf(dispatched)} />,
    'spl-associated-token-account': decoded(AssociatedTokenDetailsCard),
    'spl-memo': decoded(MemoDetailsCard),
    'spl-token': tokenCard,
    'spl-token-2022': tokenCard,
    stake: decoded(StakeDetailsCard),
    system: decoded(SystemDetailsCard),
    'token-swap': nameOnly('Token Swap'),
    vote: decoded(VoteDetailsCard),
    wormhole: nameOnly('Wormhole'),
    'zk-elgamal-proof': ({ node, dispatched, rawNode }) =>
        rawNode && <ZkElGamalProofDetailsCard node={node} parsed={parsedOf(dispatched)} />,
} satisfies Partial<Record<CardProgramLabel, ProgramRoute>>;

// The RPC sets `program`, so a label such as `toString` must not resolve to a member of `Object.prototype`.
function programRoute(dispatched: DispatchResult): ProgramRoute | undefined {
    const label = 'unknown' in dispatched ? dispatched.programLabel : dispatched.program;
    return Object.hasOwn(PROGRAM_CARDS, label) ? PROGRAM_CARDS[label] : undefined;
}

function parsedOf(dispatched: DispatchResult): ParsedInstructionInfo | undefined {
    return isParsedInstruction(dispatched) ? dispatched.parsed : undefined;
}

/** The card node holds the dispatch result to show its parsed payload in the Raw view. */
function decoded(Card: React.ComponentType<{ node: InstructionNode; parsed: unknown }>): ProgramRoute {
    return function decodedRoute({ node, dispatched, rawNode }) {
        return isParsedInstruction(dispatched) ? (
            <Card
                node={toInstructionNode({ ...node, ix: dispatched, raw: rawNode?.raw ?? node.raw })}
                parsed={dispatched.parsed}
            />
        ) : undefined;
    };
}

function nameOnly(programName?: string): ProgramRoute {
    return function nameOnlyRoute({ node, dispatched, rawNode }) {
        return (
            rawNode && (
                <NameOnlyDetailsCard
                    node={node}
                    name={isParsedInstruction(dispatched) ? dispatched.parsed.type : undefined}
                    programName={programName}
                />
            )
        );
    };
}

function tokenCard(route: Parameters<ProgramRoute>[0]): React.ReactElement | undefined {
    const { node, dispatched, rawNode } = route;
    if (isParsedInstruction(dispatched) && isRpcParsedBatchInstruction(dispatched.parsed)) {
        return <RpcParsedTokenBatchCard node={node} parsed={dispatched.parsed} />;
    }
    if (rawNode && isTokenBatchInstruction(rawNode.raw)) {
        return <TokenBatchCard node={rawNode} />;
    }
    return decoded(TokenDetailsCard)(route);
}

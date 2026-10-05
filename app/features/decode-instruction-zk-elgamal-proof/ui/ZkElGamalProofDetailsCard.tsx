import {
    address,
    defineInstructionCard,
    InstructionCardView,
    type InstructionNode,
    text,
} from '@entities/instruction-card';
import type { DispatchResult } from '@entities/instruction-parser';
import type { TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import type { CloseContextStateInfo, VerifyProofInfo, ZkElGamalProofParsed } from '../lib/zk-elgamal-proof-parser';

const TITLE_PREFIX = 'ZK ElGamal Proof Program';

const CloseContextStateCard = defineInstructionCard<CloseContextStateInfo>({
    fields: info => [
        address('Context State Account', info.contextState),
        address('Destination', info.destination),
        address('Authority', info.authority),
    ],
    title: `${TITLE_PREFIX}: Close Context State`,
});

const VerifyProofCard = defineInstructionCard<VerifyProofInfo>({
    fields: info => [
        info.recordAccount && address('Record Account', info.recordAccount),
        info.offset !== undefined && text('Proof Offset', info.offset),
        info.proofByteLength ? text('Proof Size', `${info.proofByteLength} bytes`) : undefined,
        info.contextState && address('Context State Account', info.contextState),
        info.contextStateAuthority && address('Context State Authority', info.contextStateAuthority),
    ],
    title: info => `${TITLE_PREFIX}: ${info.name}`,
});

type ZkElGamalProofDetailsCardProps = {
    /** The dispatcher's verdict for a ZK ElGamal Proof instruction: decoded, or registered-but-unparsed. */
    ix: DispatchResult;
    /** Raw form, for the shell's account table and hex view. */
    raw: TransactionInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

export function ZkElGamalProofDetailsCard({ ix, raw, index, innerCards, childIndex }: ZkElGamalProofDetailsCardProps) {
    const node: InstructionNode = { childIndex, index, innerCards, ix: raw, programId: raw.programId };

    if ('unknown' in ix) {
        return <InstructionCardView node={node} title={`${TITLE_PREFIX}: Unknown Instruction`} defaultRaw />;
    }

    const parsed = ix.parsed as ZkElGamalProofParsed;
    switch (parsed.type) {
        case 'CloseContextState':
            return <CloseContextStateCard info={parsed.info} node={node} />;
        case 'VerifyProof':
            return <VerifyProofCard info={parsed.info} node={node} />;
    }
}

import {
    address,
    defineInstructionCard,
    InstructionCardView,
    type InstructionNode,
    text,
} from '@entities/instruction-card';
import type { ParsedInstructionInfo } from '@entities/instruction-parser';

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
    node: InstructionNode;
    /** `undefined` when the parser of the program cannot decode the instruction. */
    parsed: ParsedInstructionInfo | undefined;
};

export function ZkElGamalProofDetailsCard({ node, parsed }: ZkElGamalProofDetailsCardProps) {
    if (!parsed) {
        return <InstructionCardView node={node} title={`${TITLE_PREFIX}: Unknown Instruction`} />;
    }

    const parsedInfo = parsed as ZkElGamalProofParsed;
    switch (parsedInfo.type) {
        case 'CloseContextState':
            return <CloseContextStateCard info={parsedInfo.info} node={node} />;
        case 'VerifyProof':
            return <VerifyProofCard info={parsedInfo.info} node={node} />;
    }
}

import { InstructionCardView, type InstructionNode } from '@entities/instruction-card';
import type { DispatchResult } from '@entities/instruction-parser';
import { PYTH_INSTRUCTIONS, type PythParsed } from '@explorer/decoder-pyth';
import type { TransactionInstruction } from '@solana/web3.js';

import { AddMappingDetailsCard } from './instructions/AddMappingDetailsCard';
import { AddPriceDetailsCard } from './instructions/AddPriceDetailsCard';
import { AddProductDetailsCard } from './instructions/AddProductDetailsCard';
import { AggregatePriceDetailsCard } from './instructions/AggregatePriceDetailsCard';
import { InitMappingDetailsCard } from './instructions/InitMappingDetailsCard';
import { InitPriceDetailsCard } from './instructions/InitPriceDetailsCard';
import { AddPublisherDetailsCard, DeletePublisherDetailsCard } from './instructions/PublisherDetailsCards';
import { SetMinPublishersDetailsCard } from './instructions/SetMinPublishersDetailsCard';
import { UpdatePriceDetailsCard, UpdatePriceNoFailOnErrorDetailsCard } from './instructions/UpdatePriceDetailsCards';
import { UpdateProductDetailsCard } from './instructions/UpdateProductDetailsCard';

type PythDetailsCardProps = {
    /** The dispatcher's verdict for a Pyth instruction: decoded, or registered-but-unparsed. */
    ix: DispatchResult;
    /** Raw form, for the shell's account table and hex view. */
    raw: TransactionInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

export function PythDetailsCard({ ix, raw, index, innerCards, childIndex }: PythDetailsCardProps) {
    const node: InstructionNode = { childIndex, index, innerCards, ix: raw, programId: raw.programId };

    if ('unknown' in ix) {
        return <RawOnlyPythCard node={node} title="Pyth: Unknown Instruction" />;
    }

    const parsed = ix.parsed as PythParsed;
    switch (parsed.type) {
        case 'InitMapping':
            return <InitMappingDetailsCard info={parsed.info} node={node} />;
        case 'AddMapping':
            return <AddMappingDetailsCard info={parsed.info} node={node} />;
        case 'AddProduct':
            return <AddProductDetailsCard info={parsed.info} node={node} />;
        case 'UpdateProduct':
            return <UpdateProductDetailsCard info={parsed.info} node={node} />;
        case 'AddPrice':
            return <AddPriceDetailsCard info={parsed.info} node={node} />;
        case 'AddPublisher':
            return <AddPublisherDetailsCard info={parsed.info} node={node} />;
        case 'DeletePublisher':
            return <DeletePublisherDetailsCard info={parsed.info} node={node} />;
        case 'UpdatePrice':
            return <UpdatePriceDetailsCard info={parsed.info} node={node} />;
        case 'UpdatePriceNoFailOnError':
            return <UpdatePriceNoFailOnErrorDetailsCard info={parsed.info} node={node} />;
        case 'AggregatePrice':
            return <AggregatePriceDetailsCard info={parsed.info} node={node} />;
        case 'InitPrice':
            return <InitPriceDetailsCard info={parsed.info} node={node} />;
        case 'SetMinPublishers':
            return <SetMinPublishersDetailsCard info={parsed.info} node={node} />;
        // The oracle's two test instructions carry no payload, so there is nothing to tabulate.
        case 'InitTest':
        case 'UpdateTest':
            return <RawOnlyPythCard node={node} title={`Pyth: ${PYTH_INSTRUCTIONS[parsed.type].name}`} />;
        default: {
            // A new instruction type has to pick its card here rather than reach the raw fallback.
            const _exhaustive: never = parsed;
            return _exhaustive;
        }
    }
}

/** Raw hex is the whole content, so the card opens on it and the shell draws its own Program row. */
function RawOnlyPythCard({ node, title }: { node: InstructionNode; title: string }) {
    return <InstructionCardView node={node} title={title} defaultRaw />;
}

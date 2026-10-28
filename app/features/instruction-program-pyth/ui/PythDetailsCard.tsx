import { InstructionCardView, type InstructionNode } from '@entities/instruction-card';
import type { ParsedInstructionInfo } from '@entities/instruction-parser';
import { PYTH_INSTRUCTIONS, type PythParsed } from '@explorer/decoder-pyth';

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
    node: InstructionNode;
    /** `undefined` when the parser of the program cannot decode the instruction. */
    parsed: ParsedInstructionInfo | undefined;
};

export function PythDetailsCard({ node, parsed }: PythDetailsCardProps) {
    if (!parsed) {
        return <RawOnlyPythCard node={node} title="Pyth: Unknown Instruction" />;
    }

    const parsedInfo = parsed as PythParsed;
    switch (parsedInfo.type) {
        case 'InitMapping':
            return <InitMappingDetailsCard info={parsedInfo.info} node={node} />;
        case 'AddMapping':
            return <AddMappingDetailsCard info={parsedInfo.info} node={node} />;
        case 'AddProduct':
            return <AddProductDetailsCard info={parsedInfo.info} node={node} />;
        case 'UpdateProduct':
            return <UpdateProductDetailsCard info={parsedInfo.info} node={node} />;
        case 'AddPrice':
            return <AddPriceDetailsCard info={parsedInfo.info} node={node} />;
        case 'AddPublisher':
            return <AddPublisherDetailsCard info={parsedInfo.info} node={node} />;
        case 'DeletePublisher':
            return <DeletePublisherDetailsCard info={parsedInfo.info} node={node} />;
        case 'UpdatePrice':
            return <UpdatePriceDetailsCard info={parsedInfo.info} node={node} />;
        case 'UpdatePriceNoFailOnError':
            return <UpdatePriceNoFailOnErrorDetailsCard info={parsedInfo.info} node={node} />;
        case 'AggregatePrice':
            return <AggregatePriceDetailsCard info={parsedInfo.info} node={node} />;
        case 'InitPrice':
            return <InitPriceDetailsCard info={parsedInfo.info} node={node} />;
        case 'SetMinPublishers':
            return <SetMinPublishersDetailsCard info={parsedInfo.info} node={node} />;
        // The oracle's two test instructions carry no payload, so there is nothing to tabulate.
        case 'InitTest':
        case 'UpdateTest':
            return <RawOnlyPythCard node={node} title={`Pyth: ${PYTH_INSTRUCTIONS[parsedInfo.type].name}`} />;
        default: {
            // A new instruction type has to pick its card here rather than reach the raw fallback.
            const _exhaustive: never = parsedInfo;
            return _exhaustive;
        }
    }
}

/** Raw hex is the whole content, so the card opens on it and the frame draws its own Program row. */
function RawOnlyPythCard({ node, title }: { node: InstructionNode; title: string }) {
    return <InstructionCardView node={node} title={title} />;
}

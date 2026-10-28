'use client';

import React from 'react';

import { note } from '../model/fields';
import { type InstructionNode, type InstructionPosition, positionLabel } from '../model/node';
import { useInstructionSurface } from '../model/surface';
import { InstructionCardFrame } from './InstructionCardFrame';
import { InstructionFieldRows } from './InstructionFields';

export function InstructionNodeCards({
    nodes,
    parent,
}: {
    nodes: ReadonlyArray<InstructionNode | undefined>;
    parent?: InstructionNode;
}) {
    const { Card } = useInstructionSurface();

    return (
        <>
            {nodes.map((node, i) =>
                node ? (
                    <Card key={i} node={node} />
                ) : (
                    <UndisplayableInstructionCard
                        key={i}
                        position={parent ? { childIndex: i, index: parent.index } : { index: i }}
                    />
                ),
            )}
        </>
    );
}

// The page has no instruction to show, so the card draws the frame without a Raw view.
function UndisplayableInstructionCard({ position }: { position: InstructionPosition }) {
    const { result } = useInstructionSurface();

    return (
        <InstructionCardFrame title="Unknown Instruction" result={result} position={position}>
            <InstructionFieldRows
                fields={[note(`Could not display instruction #${positionLabel(position)}, please report`, 'warning')]}
            />
        </InstructionCardFrame>
    );
}

'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { useScrollAnchor } from '@providers/scroll-anchor';
import getInstructionCardScrollAnchorId from '@utils/get-instruction-card-scroll-anchor-id';
import React from 'react';

import type { InstructionNode } from '../model/node';
import { useInstructionSurface } from '../model/surface';

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
            {nodes.map((node, position) =>
                node ? (
                    <Card key={position} node={node} />
                ) : (
                    <UndisplayableInstructionCard
                        key={position}
                        index={parent ? parent.index : position}
                        childIndex={parent ? position : undefined}
                    />
                ),
            )}
        </>
    );
}

function UndisplayableInstructionCard({ index, childIndex }: { index: number; childIndex?: number }) {
    const position = childIndex === undefined ? [index + 1] : [index + 1, childIndex + 1];
    const scrollAnchorRef = useScrollAnchor(getInstructionCardScrollAnchorId(position));

    return (
        <div ref={scrollAnchorRef}>
            <ErrorCard text={`Could not display instruction #${position.join('.')}, please report`} />
        </div>
    );
}

'use client';

import React from 'react';

import type { InstructionNode } from '../model/node';
import { useInstructionSurface } from '../model/surface';

export function InstructionCardView({
    node,
    title,
    defaultRaw,
    events,
    children,
}: {
    node: InstructionNode;
    title: string;
    defaultRaw?: boolean;
    /**
     * Program events the card derived itself — typically from transaction logs
     * via a hook, so they cannot come from the node or the field descriptors.
     * The inspector's shell ignores them, which is correct: it has no logs.
     */
    events?: React.ReactNode[];
    /** Optional: a card that opens in raw mode has no field table to draw behind it. */
    children?: React.ReactNode;
}) {
    const { Shell, result } = useInstructionSurface();

    return (
        <Shell
            title={title}
            ix={node.ix}
            index={node.index}
            childIndex={node.childIndex}
            raw={node.raw}
            result={result}
            defaultRaw={defaultRaw}
            innerCards={node.innerCards}
            eventCards={events}
        >
            {children}
        </Shell>
    );
}

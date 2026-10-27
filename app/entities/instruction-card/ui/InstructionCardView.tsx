'use client';

import React from 'react';

import type { InstructionNode } from '../model/node';
import { useInstructionSurface } from '../model/surface';
import { InstructionNodeCards } from './InstructionNodeCards';

export function InstructionCardView({
    node,
    title,
    defaultRaw,
    collapsible,
    events,
    children,
}: {
    node: InstructionNode;
    title: string;
    defaultRaw?: boolean;
    collapsible?: boolean;
    /**
     * Program events the card derived itself — typically from transaction logs
     * via a hook, so they cannot come from the node or the field descriptors.
     * The inspector has no transaction logs, so its cards have no events.
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
            collapsible={collapsible}
            childCards={
                node.children && node.children.length > 0 ? (
                    <InstructionNodeCards nodes={node.children} parent={node} />
                ) : undefined
            }
            eventCards={events}
        >
            {children}
        </Shell>
    );
}

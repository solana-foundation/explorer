'use client';

import React from 'react';

import type { InstructionEvent } from '../model/events';
import type { InstructionNode } from '../model/node';
import { rawSourceOf } from '../model/raw-source';
import { useInstructionSurface } from '../model/surface';
import { BaseInstructionCard } from './BaseInstructionCard';

export function InstructionCardView({
    node,
    title,
    collapsible = false,
    events,
    children,
}: {
    node: InstructionNode;
    title: string;
    collapsible?: boolean;
    /**
     * Program events the card derived itself — typically from transaction logs
     * via a hook, so they cannot come from the node or the field descriptors.
     * The inspector has no transaction logs, so its cards have no events.
     */
    events?: readonly InstructionEvent[];
    /** The decoded view. A card without one opens on the Raw view and cannot leave it. */
    children?: React.ReactNode;
}) {
    const surface = useInstructionSurface();

    return (
        <BaseInstructionCard
            node={node}
            title={title}
            result={surface.result}
            rawSource={rawSourceOf(node, surface.rawInstructions)}
            collapsible={collapsible || surface.collapsible}
            validateProgram={surface.validateProgram}
            events={events}
        >
            {children}
        </BaseInstructionCard>
    );
}

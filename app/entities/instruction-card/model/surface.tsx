'use client';

import type { ParsedInstruction, SignatureResult, TransactionInstruction, TransactionSignature } from '@solana/web3.js';
import React, { createContext, useContext } from 'react';

import type { InstructionNode } from './node';

/** The subset of shell props every instruction shell accepts. */
export type InstructionShellProps = {
    title: string;
    children?: React.ReactNode;
    result: SignatureResult;
    index: number;
    ix: TransactionInstruction | ParsedInstruction;
    defaultRaw?: boolean;
    collapsible?: boolean;
    childCards?: React.ReactNode;
    childIndex?: number;
    raw?: TransactionInstruction;
    /**
     * Program events, e.g. Anchor's `ProgramEventsCard`. Unlike `childCards`,
     * these are *derived by the card* from transaction logs rather than passed
     * down, so they arrive as a prop on `InstructionCardView`, not on the node.
     * The inspector's shell drops them.
     */
    eventCards?: React.ReactNode[];
};

export type InstructionSurface = {
    /** Card frame: index badge, Raw toggle, scroll anchor, nesting slot. */
    Shell: React.ComponentType<InstructionShellProps>;
    /** The page passes `Card`, because the entity must not import the card of every program. */
    Card: React.ComponentType<{ node: InstructionNode }>;
    /** Per-transaction, so it belongs here rather than on every card. */
    result: SignatureResult;
    /**
     * The key is required, because a missing signature throws no error. The
     * frame then fetches no raw transaction, and a card shows no program events.
     */
    signature: TransactionSignature | undefined;
    /** Returns the data of the top-level instruction at `index`, which an ed25519 instruction can reference. */
    instructionData: (index: number) => Uint8Array | undefined;
};

const InstructionSurfaceContext = createContext<InstructionSurface | undefined>(undefined);

export function InstructionSurfaceProvider({
    surface,
    children,
}: {
    surface: InstructionSurface;
    children: React.ReactNode;
}) {
    return <InstructionSurfaceContext.Provider value={surface}>{children}</InstructionSurfaceContext.Provider>;
}

export function useInstructionSurface(): InstructionSurface {
    const surface = useContext(InstructionSurfaceContext);
    if (!surface) {
        throw new Error('useInstructionSurface must be used inside an <InstructionSurfaceProvider>');
    }
    return surface;
}

'use client';

import type { SignatureResult, TransactionSignature } from '@solana/web3.js';
import React, { createContext, useContext } from 'react';

import type { InstructionNode } from './node';
import type { RawInstructions } from './raw-source';

export type InstructionSurface = {
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
    /** The key is required for the same reason as `signature`. `undefined` means the page has nothing to fetch. */
    rawInstructions: RawInstructions | undefined;
    collapsible: boolean;
    /** Checks in the Raw view that the program exists and is executable. */
    validateProgram: boolean;
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

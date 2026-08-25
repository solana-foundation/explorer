'use client';

import type { ParsedInstruction, PublicKey, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React, { createContext, useContext } from 'react';

/** The subset of shell props every instruction shell accepts. */
export type InstructionShellProps = {
    title: string;
    children?: React.ReactNode;
    result: SignatureResult;
    index: number;
    ix: TransactionInstruction | ParsedInstruction;
    defaultRaw?: boolean;
    innerCards?: JSX.Element[];
    childIndex?: number;
    raw?: TransactionInstruction;
    /**
     * Program events, e.g. Anchor's `ProgramEventsCard`. Unlike `innerCards`,
     * these are *derived by the card* from transaction logs rather than passed
     * down, so they arrive as a prop on `InstructionCardView`, not on the node.
     * Tx-page only — the inspector has no logs, and its shell drops them.
     */
    eventCards?: React.ReactNode[];
};

export type InstructionAddressProps = { pubkey: PublicKey };

/**
 * Where the cards are being rendered. There are two surfaces — the transaction
 * page and the inspector — and they differ only in chrome, not in meaning.
 *
 * This replaces the per-card injection props (`InstructionCardComponent`,
 * `AddressComponent`, `showProgramField`) and the `INSPECTOR_RESULT` placeholder
 * the inspector passed to satisfy card signatures.
 */
export type InstructionSurface = {
    /** Card frame: index badge, Raw toggle, scroll anchor, nesting slot. */
    Shell: React.ComponentType<InstructionShellProps>;
    /** How an account address renders on this surface. */
    Address: React.ComponentType<InstructionAddressProps>;
    /**
     * Whether the field renderer emits the leading `Program` row.
     * False in the inspector, whose shell already renders one itself.
     */
    showProgramField: boolean;
    /** Per-transaction, so it belongs here rather than on every card. */
    result: SignatureResult;
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

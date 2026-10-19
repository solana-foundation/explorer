'use client';

import { createContext, type ReactNode, useContext, useId, useState } from 'react';

import type { InstructionFetchResult, InstructionIntentResult } from '../lib/intent';
import { useInstructionIntent } from './use-instruction-intent';

type InstructionIntentContextValue = {
    innerIxIndex?: number;
    open: boolean;
    toggle: () => void;
    result: InstructionIntentResult;
    panelId: string;
};

const InstructionIntentContext = createContext<InstructionIntentContextValue | undefined>(undefined);

/**
 * The intent state of one instruction card, shared by the Intent button and its body Panel.
 * `innerIxIndex` marks the inner instruction the state belongs to.
 */
export function InstructionIntentProvider({
    programId,
    ixFetchResult,
    innerIxIndex,
    children,
}: {
    programId: string;
    ixFetchResult: InstructionFetchResult;
    innerIxIndex?: number;
    children: ReactNode;
}) {
    const panelId = useId();
    const [open, setOpen] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const result = useInstructionIntent({ enabled, ixFetchResult, programId });

    const toggle = () => {
        setOpen(value => !value);
        setEnabled(true);
    };

    return (
        <InstructionIntentContext.Provider value={{ innerIxIndex, open, panelId, result, toggle }}>
            {children}
        </InstructionIntentContext.Provider>
    );
}

export function useInstructionIntentContext(innerIxIndex?: number): InstructionIntentContextValue | undefined {
    const intent = useContext(InstructionIntentContext);
    return intent?.innerIxIndex === innerIxIndex ? intent : undefined;
}

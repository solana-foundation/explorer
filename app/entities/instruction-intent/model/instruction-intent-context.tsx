'use client';

import { createContext, type ReactNode, useContext, useId, useState } from 'react';

import type { InstructionIntentAvailability, InstructionIntentResult } from '../lib/intent';
import { useInstructionIntent } from './use-instruction-intent';

type InstructionIntentContextValue = {
    open: boolean;
    toggle: () => void;
    result: InstructionIntentResult;
    panelId: string;
};

const InstructionIntentContext = createContext<InstructionIntentContextValue | undefined>(undefined);

/**
 * The intent state of one instruction card, shared by the Intent button and its body Panel.
 */
export function InstructionIntentProvider({
    programId,
    ixIntentAvailability,
    children,
}: {
    programId: string;
    ixIntentAvailability: InstructionIntentAvailability;
    children: ReactNode;
}) {
    const panelId = useId();
    const [open, setOpen] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const result = useInstructionIntent({ enabled, ixIntentAvailability, programId });

    const toggle = () => {
        setOpen(value => !value);
        setEnabled(true);
    };

    return (
        <InstructionIntentContext.Provider value={{ open, panelId, result, toggle }}>
            {children}
        </InstructionIntentContext.Provider>
    );
}

export function useInstructionIntentContext(): InstructionIntentContextValue | undefined {
    return useContext(InstructionIntentContext);
}

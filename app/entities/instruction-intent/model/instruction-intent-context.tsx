'use client';

import { createContext, useContext } from 'react';

import type { InstructionIntentResult } from '../lib/intent';

export type InstructionIntentContextValue = {
    open: boolean;
    toggle: () => void;
    result: InstructionIntentResult;
    panelId: string;
};

// Apart from the provider so the Intent button and row do not bundle useInstructionIntent and the Codama parser
export const InstructionIntentContext = createContext<InstructionIntentContextValue | undefined>(undefined);

export function useInstructionIntentContext(): InstructionIntentContextValue | undefined {
    return useContext(InstructionIntentContext);
}

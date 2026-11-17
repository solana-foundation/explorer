'use client';

import { type ReactNode, useId, useState } from 'react';

import type { InstructionFetchResult } from '../lib/intent';
import { InstructionIntentContext } from './instruction-intent-context';
import { useInstructionIntent } from './use-instruction-intent';

/** The intent state of one card, shared by its Intent button and its intent row. */
export function InstructionIntentProvider({
    programId,
    ixFetchResult,
    children,
}: {
    programId: string;
    ixFetchResult: InstructionFetchResult;
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
        <InstructionIntentContext.Provider value={{ open, panelId, result, toggle }}>
            {children}
        </InstructionIntentContext.Provider>
    );
}

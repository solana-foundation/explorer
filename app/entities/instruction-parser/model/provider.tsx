'use client';

import type { InstructionParserDispatcher } from '@explorer/parsers';
import React, { createContext, useContext } from 'react';

const InstructionParserContext = createContext<InstructionParserDispatcher | undefined>(undefined);

export function InstructionParserProvider({
    dispatcher,
    children,
}: {
    dispatcher: InstructionParserDispatcher;
    children: React.ReactNode;
}) {
    return <InstructionParserContext.Provider value={dispatcher}>{children}</InstructionParserContext.Provider>;
}

export function useInstructionParser(): InstructionParserDispatcher {
    const dispatcher = useContext(InstructionParserContext);
    if (!dispatcher) {
        throw new Error('useInstructionParser must be used inside an <InstructionParserProvider>');
    }
    return dispatcher;
}

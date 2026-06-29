'use client';

import { InstructionParserProvider } from '@entities/instruction-parser';
import React from 'react';

import { instructionParserDispatcher } from './instruction-parser-dispatcher';

// Client wrapper so the server layout can supply the (non-serializable) dispatcher to every /tx route.
export function TxInstructionParserProvider({ children }: { children: React.ReactNode }) {
    return <InstructionParserProvider dispatcher={instructionParserDispatcher}>{children}</InstructionParserProvider>;
}

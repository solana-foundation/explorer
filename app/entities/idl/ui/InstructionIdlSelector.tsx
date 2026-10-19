'use client';

import { createContext, type ReactNode, useContext } from 'react';

import { ProgramIdlSelector } from './ProgramIdlSelector';

const InstructionProgramContext = createContext<string | undefined>(undefined);

export function InstructionIdlSelectorProvider({
    programAddress,
    children,
}: {
    programAddress: string | undefined;
    children: ReactNode;
}) {
    return <InstructionProgramContext.Provider value={programAddress}>{children}</InstructionProgramContext.Provider>;
}

export function InstructionIdlSelector() {
    const programAddress = useContext(InstructionProgramContext);
    // eslint-disable-next-line unicorn/no-null -- a React component returns null to render nothing
    return programAddress ? <ProgramIdlSelector programAddress={programAddress} /> : null;
}

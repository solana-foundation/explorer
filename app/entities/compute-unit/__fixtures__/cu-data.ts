import type { InstructionCUData } from '../lib/types';

export function cuData(overrides: Partial<InstructionCUData>): InstructionCUData {
    return { computeUnits: 1000, programId: 'TestProgram', ...overrides };
}

import type { InstructionCUData } from '../lib/types';

export function cuData(overrides: Partial<InstructionCUData>): InstructionCUData {
    return { computeUnits: 1000, defaultUnits: 0, programId: 'TestProgram', scheduledUnits: 200000, ...overrides };
}

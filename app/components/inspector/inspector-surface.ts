import type { InstructionSurface } from '@entities/instruction-card';

import { InspectorInstructionCard } from '../common/InspectorInstructionCard';

// eslint-disable-next-line unicorn/no-null -- SignatureResult.err is `TransactionError | null`
export const INSPECTOR_RESULT = { err: null };

export const INSPECTOR_SURFACE: InstructionSurface = {
    Shell: InspectorInstructionCard,
    result: INSPECTOR_RESULT,
    signature: undefined,
};

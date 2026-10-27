import type { InstructionSurface } from '@entities/instruction-card';

import { InspectorInstructionCard } from '../common/InspectorInstructionCard';

export const INSPECTOR_SURFACE: InstructionSurface = {
    Shell: InspectorInstructionCard,
    // eslint-disable-next-line unicorn/no-null -- SignatureResult.err is `TransactionError | null`
    result: { err: null },
    signature: undefined,
};

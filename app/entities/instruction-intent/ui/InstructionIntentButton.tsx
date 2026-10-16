'use client';

import { useInstructionIntentContext } from '../model/instruction-intent-context';
import { BaseInstructionIntentButton } from './BaseInstructionIntentButton';

export function InstructionIntentButton() {
    const intent = useInstructionIntentContext();
    if (!intent) return undefined;

    const { open, panelId, result, toggle } = intent;
    return (
        <BaseInstructionIntentButton
            open={open}
            loading={open && result.status === 'loading'}
            unavailable={result.status === 'unavailable'}
            failed={result.status === 'failed'}
            aria-controls={open ? panelId : undefined}
            onClick={toggle}
        />
    );
}

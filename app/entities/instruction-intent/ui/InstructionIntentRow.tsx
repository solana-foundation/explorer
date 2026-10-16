'use client';

import { BaseTable } from '@/app/shared/ui/Table';

import { useInstructionIntentContext } from '../model/instruction-intent-context';
import { InstructionIntentPanel } from './InstructionIntentPanel';

export function InstructionIntentRow() {
    const intent = useInstructionIntentContext();
    if (!intent?.open || intent.result.status === 'idle') return undefined;

    return (
        <BaseTable.Row>
            {/* The card table pins edge-cell padding with higher-specificity selectors, and the panel sets its own */}
            <BaseTable.Cell colSpan={3} className="!p-0">
                <InstructionIntentPanel id={intent.panelId} intent={intent.result} />
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

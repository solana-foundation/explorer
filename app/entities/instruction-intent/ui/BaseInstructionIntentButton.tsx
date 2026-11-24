import { Button } from '@components/shared/ui/button';
import type { AriaAttributes } from 'react';
import { AlignLeft, Loader } from 'react-feather';

import type { InstructionIntentResult } from '../lib/intent';

type BaseInstructionIntentButtonProps = {
    open: boolean;
    status: InstructionIntentResult['status'];
    onClick: () => void;
} & Omit<AriaAttributes, 'aria-busy' | 'aria-expanded' | 'aria-label'>;

export function BaseInstructionIntentButton({ open, status, onClick, ...aria }: BaseInstructionIntentButtonProps) {
    const loading = open && status === 'loading';
    const label = getLabel(status);

    return (
        <Button
            {...aria}
            ui="dashkit"
            size="sm"
            variant={open ? 'black' : 'white'}
            active={open}
            dashed={status === 'unavailable' || status === 'failed'}
            aria-label={label}
            title={label}
            aria-expanded={open}
            aria-busy={loading || undefined}
            onClick={onClick}
            // Icon-only below `md` has no text line, so the button stretches to the height of Raw
            className="flex items-center self-stretch"
            data-testid="instruction-intent-trigger"
        >
            {loading ? (
                <Loader size={13} className="animate-spin md:mr-1.5" />
            ) : (
                <AlignLeft size={13} className="md:mr-1.5" />
            )}
            <span className="hidden md:inline">Intent</span>
        </Button>
    );
}

function getLabel(status: InstructionIntentResult['status']): string {
    if (status === 'failed') return 'Intent failed to load';
    if (status === 'unavailable') return 'Intent unavailable';
    return 'Intent';
}

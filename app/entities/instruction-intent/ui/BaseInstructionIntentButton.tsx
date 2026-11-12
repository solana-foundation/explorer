import { Button } from '@components/shared/ui/button';
import type { AriaAttributes } from 'react';
import { AlignLeft, Loader } from 'react-feather';

type BaseInstructionIntentButtonProps = {
    open: boolean;
    loading?: boolean;
    unavailable?: boolean;
    failed?: boolean;
    onClick: () => void;
} & Omit<AriaAttributes, 'aria-busy' | 'aria-expanded' | 'aria-label'>;

export function BaseInstructionIntentButton({
    open,
    loading = false,
    unavailable = false,
    failed = false,
    onClick,
    ...aria
}: BaseInstructionIntentButtonProps) {
    const label = getLabel({ failed, unavailable });

    return (
        <Button
            {...aria}
            ui="dashkit"
            size="sm"
            variant={open ? 'black' : 'white'}
            active={open}
            dashed={unavailable || failed}
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

function getLabel({ failed, unavailable }: { failed: boolean; unavailable: boolean }): string {
    if (failed) return 'Intent failed to load';
    if (unavailable) return 'Intent unavailable';
    return 'Intent';
}

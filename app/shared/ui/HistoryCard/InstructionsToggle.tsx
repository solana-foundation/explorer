'use client';

import { type ComponentProps } from 'react';
import { List } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';
import { cn } from '@/app/components/shared/utils';

import { useShowInstructions } from './use-show-instructions';

type InstructionsToggleProps = Omit<ComponentProps<typeof Button>, 'onClick' | 'aria-pressed' | 'children' | 'active'>;

// Header action that flips the persisted "show instructions" preference for every history list. The
// preference survives reloads, so the button shows its on/off state visibly rather than via aria-pressed
// alone: dashkit callers get the `active` ring, tw callers get the same filled/outline swap as the
// BaseAccountCard "Raw" toggle.
export function InstructionsToggle({ size = 'sm', ui, variant, className, ...props }: InstructionsToggleProps) {
    const [show, setShow] = useShowInstructions();
    const dashkit = ui === 'dashkit';
    return (
        <Button
            size={size}
            ui={ui}
            variant={dashkit ? variant : show ? 'default' : 'outline'}
            active={dashkit ? show : undefined}
            className={cn(!dashkit && show && 'shadow-active-sm', className)}
            aria-pressed={show}
            aria-label={show ? 'Hide instructions' : 'Show instructions'}
            title={show ? 'Hide instructions' : 'Show instructions'}
            onClick={() => setShow(!show)}
            {...props}
        >
            <List />
            <span className="hidden md:inline">Instructions</span>
        </Button>
    );
}

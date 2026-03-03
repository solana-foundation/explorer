import { Button } from '@components/shared/ui/button';
import * as Popover from '@radix-ui/react-popover';
import type { ReactNode } from 'react';
import { ChevronDown, Share2 } from 'react-feather';

interface BaseShareButtonProps {
    children: ReactNode;
}

export function BaseShareButton({ children }: BaseShareButtonProps) {
    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <Button variant="compact" size="compact">
                    <Share2 size={12} />
                    Share
                    <ChevronDown size={12} />
                </Button>
            </Popover.Trigger>

            <Popover.Portal>
                <Popover.Content
                    side="bottom"
                    align="start"
                    sideOffset={4}
                    className="e-rounded-sm e-border e-border-solid e-border-outer-space-800 e-bg-outer-space-900 e-shadow-lg"
                >
                    {children}
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}

import { Button } from '@components/shared/ui/button';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, Link, Share2 } from 'react-feather';

interface BaseShareButtonProps {
    copied?: boolean;
    onCopyLink: () => void;
}

export function BaseShareButton({ copied, onCopyLink }: BaseShareButtonProps) {
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
                    <button
                        type="button"
                        onClick={onCopyLink}
                        className="e-flex e-w-full e-items-center e-gap-1 e-border-0 e-bg-transparent e-px-2 e-py-1.5 e-text-[11px] e-leading-none e-tracking-[-0.44px] e-text-neutral-200 hover:e-bg-outer-space-800"
                    >
                        {copied ? <Check size={11} /> : <Link size={11} />}
                        {copied ? 'Copied!' : 'Copy link'}
                    </button>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}

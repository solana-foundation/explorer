import { cva, type VariantProps } from 'class-variance-authority';

import { ParsedTokenExtension } from '@/app/components/account/types';
import { StatusBadge } from '@/app/components/shared/StatusBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';

const badgeVariants = cva('', {
    defaultVariants: {
        size: 'sm',
    },
    variants: {
        size: {
            sm: 'e-text-14',
        },
    },
});

export function TokenExtensionBadge({
    extension,
    size,
}: { extension: ParsedTokenExtension } & VariantProps<typeof badgeVariants>) {
    const { status, tooltip, name } = extension;

    return (
        <Tooltip>
            <TooltipTrigger className="badge border-0 bg-transparent">
                <StatusBadge status={status} label={name} className={badgeVariants({ size })} />
            </TooltipTrigger>
            {tooltip && (
                <TooltipContent>
                    <div className="e-min-w-36 e-max-w-16">{tooltip}</div>
                </TooltipContent>
            )}
        </Tooltip>
    );
}

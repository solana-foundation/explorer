import { cva, type VariantProps } from 'class-variance-authority';
import { useCallback } from 'react';

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
    label,
    onClick,
    size,
}: {
    extension: ParsedTokenExtension;
    label?: string;
    onClick?: ({ extensionName }: { extensionName: ParsedTokenExtension['extension'] }) => void;
} & VariantProps<typeof badgeVariants>) {
    const { extension: extensionName, status, tooltip } = extension;

    const handleClick = useCallback(() => {
        onClick?.({ extensionName });
    }, [extensionName, onClick]);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="e-inline-block e-cursor-default" onClick={handleClick}>
                    <StatusBadge status={status} label={label} className={badgeVariants({ size })} />
                </div>
            </TooltipTrigger>
            {tooltip && (
                <TooltipContent>
                    <div className="e-min-w-36 e-max-w-16">{tooltip}</div>
                </TooltipContent>
            )}
        </Tooltip>
    );
}

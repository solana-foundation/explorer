import { ComponentProps } from 'react';

import { ParsedTokenExtension } from '@/app/components/account/types';
import { cn } from '@/app/components/shared/utils';

import { TokenExtensionBadge } from './TokenExtensionBadge';

export function TokenExtensionBadges({
    className,
    extensions,
    onClick,
}: {
    className?: string;
    extensions: ParsedTokenExtension[];
    onClick?: ComponentProps<typeof TokenExtensionBadge>['onClick'];
}) {
    return (
        <div className={cn('e-flex e-flex-wrap e-gap-2', className)}>
            {extensions.map(extension => (
                <TokenExtensionBadge
                    key={extension.extension}
                    extension={extension}
                    label={extension.extension}
                    onClick={onClick}
                />
            ))}
        </div>
    );
}

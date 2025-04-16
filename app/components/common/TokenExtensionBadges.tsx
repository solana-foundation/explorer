import { ComponentProps } from 'react';

import { ParsedTokenExtension } from '@/app/components/account/types';

import { TokenExtensionBadge } from './TokenExtensionBadge';

export function TokenExtensionBadges({
    extensions,
    onClick,
}: {
    extensions: ParsedTokenExtension[];
    onClick?: ComponentProps<typeof TokenExtensionBadge>['onClick'];
}) {
    return (
        <div className="e-flex e-flex-wrap e-gap-2">
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

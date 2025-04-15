import { ParsedTokenExtension } from '@/app/components/account/types';

import { TokenExtensionBadge } from './TokenExtensionBadge';

export function TokenExtensionBadges({ extensions }: { extensions: ParsedTokenExtension[] }) {
    return (
        <div className="e-flex e-flex-wrap e-gap-2">
            {extensions.map(extension => (
                <TokenExtensionBadge key={extension.extension} extension={extension} label={extension.extension} />
            ))}
        </div>
    );
}

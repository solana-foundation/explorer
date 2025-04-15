import { ParsedTokenExtension } from '@/app/components/account/types';

import { TokenExtensionBadge } from './TokenExtensionBadge';

export function TokenExtensionBadges({ extensions }: { extensions: ParsedTokenExtension[] }) {
    return (
        <div className="flex flex-wrap gap-1">
            {extensions.map(extension => (
                <TokenExtensionBadge key={extension.extension} extension={extension} />
            ))}
        </div>
    );
}

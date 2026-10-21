import { useCallback, useMemo } from 'react';

import { useTokenExtensionNavigation } from '@/app/features/token-extensions/use-token-extension-navigation';
import { KeyValue } from '@/app/shared/ui/key-value';
import { populatePartialParsedTokenExtension } from '@/app/utils/token-extension';
import { TokenExtension } from '@/app/validators/accounts/token-extension';

import { ParsedTokenExtension } from '../types';
import { TokenExtensionBadges } from './TokenExtensionBadges';

export function TokenExtensionsStatusRow({ address, extensions }: { address: string; extensions: TokenExtension[] }) {
    const extension = useTokenExtensionNavigation({ uriComponent: `/address/${address}` });
    // bypass root uriComponent to not play guessing inside the component as Row might be rendered at different pages

    const parsedExtensions = useMemo(() => {
        return extensions.reduce((acc, ext) => {
            acc.push({
                extension: ext.extension,
                parsed: ext,
                ...populatePartialParsedTokenExtension(ext.extension),
            });

            return acc;
        }, [] as ParsedTokenExtension[]);
    }, [extensions]);

    const onClick = useCallback(
        (ext: { extensionName: TokenExtension['extension'] }) => {
            extension.navigateToExtension(ext.extensionName);
        },
        [extension],
    );

    return (
        <KeyValue label="Extensions">
            <TokenExtensionBadges extensions={parsedExtensions} onClick={onClick} />
        </KeyValue>
    );
}

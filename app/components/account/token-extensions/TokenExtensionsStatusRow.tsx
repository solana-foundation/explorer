import { useCallback, useMemo } from 'react';

import { useTokenExtensionNavigation } from '@/app/features/token-extensions/use-token-extension-navigation';
import { populatePartialParsedTokenExtension } from '@/app/utils/token-extension';
import { TokenExtension } from '@/app/validators/accounts/token-extension';

import { TokenExtensionBadges } from '../../common/TokenExtensionBadges';
import { ParsedTokenExtension } from '../types';

export function TokenExtensionsStatusRow({ address, extensions }: { address: string; extensions: TokenExtension[] }) {
    const extension = useTokenExtensionNavigation({ uriComponent: `/address/${address}` });
    // bypass root uriComponent to not play guessing inside the compoent as Row might be rendered at different pages

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
        [extension]
    );

    return (
        <tr>
            <td>Extensions</td>
            <td className="text-lg-end">
                <TokenExtensionBadges className="md:e-justify-end" extensions={parsedExtensions} onClick={onClick} />
            </td>
        </tr>
    );
}

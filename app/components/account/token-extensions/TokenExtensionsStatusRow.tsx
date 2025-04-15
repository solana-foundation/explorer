import { useMemo } from 'react';

import { populatePartialParsedTokenExtension } from '@/app/utils/token-extension';
import { TokenExtension } from '@/app/validators/accounts/token-extension';

import { TokenExtensionBadges } from '../../common/TokenExtensionBadges';
import { ParsedTokenExtension } from '../types';

export function TokenExtensionsStatusRow({ extensions }: { extensions: TokenExtension[] }) {
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

    return (
        <tr>
            <td>Token Extensions</td>
            <td className="text-lg-end">
                <TokenExtensionBadges extensions={parsedExtensions} />
            </td>
        </tr>
    );
}

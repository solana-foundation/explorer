import { useCallback, useMemo } from 'react';

import { useTokenExtensionNavigation } from '@/app/features/token-extensions/use-token-extension-navigation';
import { BaseTable } from '@/app/shared/ui/Table';
import { populatePartialParsedTokenExtension } from '@/app/utils/token-extension';
import { TokenExtension } from '@/app/validators/accounts/token-extension';

import { ParsedTokenExtension } from '../types';
import { TokenExtensionBadges } from './TokenExtensionBadges';

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
        [extension],
    );

    return (
        <BaseTable.Row>
            <BaseTable.Cell>Extensions</BaseTable.Cell>
            <BaseTable.Cell className="text-right">
                <TokenExtensionBadges className="justify-end" extensions={parsedExtensions} onClick={onClick} />
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

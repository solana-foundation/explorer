import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@components/shared/ui/accordion';
import { useCallback, useMemo, useState } from 'react';
import { Code, ExternalLink } from 'react-feather';

import { SolarizedJsonViewer as ReactJson } from '@/app/components/common/JsonViewer';
import { TableCardBodyHeaded } from '@/app/components/common/TableCardBody';
import { Badge } from '@/app/components/shared/ui/badge';
import {
    getAnchorId,
    useTokenExtensionNavigation,
} from '@/app/features/token-extensions/use-token-extension-navigation';
import { Card } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';
import { TokenExtension } from '@/app/validators/accounts/token-extension';

import { TokenExtensionBadge } from './token-extensions/TokenExtensionBadge';
import { TokenExtensionRow } from './TokenAccountSection';
import { ParsedTokenExtension } from './types';

export function TokenExtensionsSection({
    address,
    decimals,
    extensions,
    parsedExtensions,
    symbol,
}: {
    address: string;
    decimals: number;
    extensions: TokenExtension[];
    parsedExtensions: ParsedTokenExtension[];
    symbol?: string;
}) {
    const { activeExtension: selectedExtension, navigateToExtension } = useTokenExtensionNavigation({
        uriComponent: `/address/${address}`,
    });

    const onSelect = useCallback(
        (id: string) => {
            navigateToExtension(id);
        },
        [navigateToExtension],
    );

    return (
        <Accordion
            type="single"
            value={selectedExtension ?? ''}
            collapsible
            className="px-0"
            onValueChange={value => navigateToExtension(value || undefined)}
        >
            {parsedExtensions.map(ext => {
                const extension = extensions.find(({ extension }) => {
                    return extension === ext.extension;
                });

                return (
                    <AccordionItem
                        id={getAnchorId(ext)}
                        key={ext.extension}
                        value={ext.extension}
                        style={{ scrollMarginTop: 'var(--sticky-header-height, 0px)' }}
                    >
                        {extension && (
                            <TokenExtensionAccordionItem
                                decimals={decimals}
                                extension={extension}
                                onSelect={onSelect}
                                parsedExtension={ext}
                                symbol={symbol}
                            />
                        )}
                    </AccordionItem>
                );
            })}
        </Accordion>
    );
}

function TokenExtensionAccordionItem({
    decimals,
    extension,
    onSelect,
    parsedExtension,
    symbol,
}: {
    decimals: number;
    extension: TokenExtension;
    onSelect: (id: string) => void;
    parsedExtension: ParsedTokenExtension;
    symbol?: string;
}) {
    const [showRaw, setShowRaw] = useState(false);

    const handleToggleRaw = useCallback(() => {
        onSelect(parsedExtension.extension);
        setShowRaw(!showRaw);
    }, [showRaw, onSelect, parsedExtension.extension]);

    const tableHeaderComponent = useMemo(() => {
        return TokenExtensionStateHeader({ name: parsedExtension.name });
    }, [parsedExtension.name]);

    return (
        <>
            <div className="flex items-center justify-between">
                <AccordionTrigger className="items-baseline">
                    <ExtensionListItem ext={parsedExtension} />
                </AccordionTrigger>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleToggleRaw}
                        type="button"
                        className="cursor-pointer border-0 bg-transparent p-0"
                        aria-label={showRaw ? 'Hide raw data' : 'Show raw data'}
                        aria-pressed={showRaw}
                    >
                        <Badge
                            className="font-normal text-white"
                            as="link"
                            size="sm"
                            status={showRaw ? 'active' : 'inactive'}
                            variant="transparent"
                        >
                            <Code size={16} /> Raw
                        </Badge>
                    </button>
                    {parsedExtension.externalLinks.map((link, index) => (
                        <a key={index} href={link.url} target="_blank" rel="noopener noreferrer">
                            <Badge variant="transparent" size="sm" as="link" className="font-normal text-white">
                                <ExternalLink size={16} />
                                {link.label}
                            </Badge>
                        </a>
                    ))}
                </div>
            </div>
            <AccordionContent>
                {!showRaw ? (
                    <Card ui="dashkit" className="m-4">
                        <TableCardBodyHeaded headerComponent={tableHeaderComponent}>
                            {TokenExtensionRow(extension, undefined, decimals, symbol, 'omit')}
                        </TableCardBodyHeaded>
                    </Card>
                ) : (
                    <div className="p-4">
                        <ReactJson src={parsedExtension.parsed || {}} style={{ padding: 25 }} />
                    </div>
                )}
            </AccordionContent>
        </>
    );
}

function TokenExtensionStateHeader({ name }: { name: string }) {
    return (
        <BaseTable.Row>
            <BaseTable.HeaderCell className="w-px text-dk-gray-700">{name}</BaseTable.HeaderCell>
            <BaseTable.HeaderCell className="text-dk-gray-700"></BaseTable.HeaderCell>
        </BaseTable.Row>
    );
}

function ExtensionListItem({ ext }: { ext: ParsedTokenExtension }) {
    return (
        <div className="w-100 flex w-full items-center gap-2 text-sm text-white">
            {/* Name */}
            <div className="flex min-w-80 items-center gap-2 whitespace-nowrap font-normal">
                <span>{ext.name}</span>
                <TokenExtensionBadge extension={ext} />
            </div>

            {/* Description */}
            <div className="max-lg:hidden flex-1 text-[0.75rem] text-[#8E9090] underline decoration-[#1e2423]">
                {ext.description ?? null}
            </div>
        </div>
    );
}

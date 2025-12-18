import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@components/shared/ui/accordion';
import { SyntheticEvent, useCallback, useMemo, useState } from 'react';
import { Code, ExternalLink } from 'react-feather';

import { SolarizedJsonViewer as ReactJson } from '@/app/components/common/JsonViewer';
import { TableCardBodyHeaded } from '@/app/components/common/TableCardBody';
import { Badge } from '@/app/components/shared/ui/badge';
import {
    getAnchorId,
    useTokenExtensionNavigation,
} from '@/app/features/token-extensions/use-token-extension-navigation';
import { TokenExtension } from '@/app/validators/accounts/token-extension';

import { TokenExtensionBadge } from '../common/TokenExtensionBadge';
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
    const { activeExtension: selectedExtension, setActiveExtension: setSelectedExtension } =
        useTokenExtensionNavigation({ uriComponent: `/address/${address}` });

    const onSelect = useCallback(
        (id: string) => {
            setSelectedExtension(id === selectedExtension ? undefined : id);
        },
        [selectedExtension, setSelectedExtension]
    );

    // handle accordion item click to change the selected extension
    const handleSelect = useCallback(
        (e: SyntheticEvent<HTMLDivElement>) => {
            const selectedValue = e.currentTarget.dataset.value;
            if (selectedValue === selectedExtension) {
                setSelectedExtension(undefined);
            }
        },
        [selectedExtension, setSelectedExtension]
    );

    return (
        <Accordion type="single" value={selectedExtension} collapsible className="e-px-0">
            {parsedExtensions.map(ext => {
                const extension = extensions.find(({ extension }) => {
                    return extension === ext.extension;
                });

                return (
                    <AccordionItem
                        id={getAnchorId(ext)}
                        key={ext.extension}
                        value={ext.extension}
                        onClick={handleSelect}
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
            <div className="e-flex e-items-center e-justify-between">
                <AccordionTrigger className="e-items-baseline">
                    <ExtensionListItem ext={parsedExtension} />
                </AccordionTrigger>
                <div className="e-flex e-items-center e-gap-1">
                    <button
                        onClick={handleToggleRaw}
                        type="button"
                        className="e-cursor-pointer e-border-0 e-bg-transparent e-p-0"
                        aria-label={showRaw ? 'Hide raw data' : 'Show raw data'}
                        aria-pressed={showRaw}
                    >
                        <Badge
                            className="text-white e-font-normal"
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
                            <Badge variant="transparent" size="sm" as="link" className="text-white e-font-normal">
                                <ExternalLink size={16} />
                                {link.label}
                            </Badge>
                        </a>
                    ))}
                </div>
            </div>
            <AccordionContent>
                {!showRaw ? (
                    <div className="card e-m-4">
                        <TableCardBodyHeaded headerComponent={tableHeaderComponent}>
                            {TokenExtensionRow(extension, undefined, decimals, symbol, 'omit')}
                        </TableCardBodyHeaded>
                    </div>
                ) : (
                    <div className="e-p-4">
                        <ReactJson src={parsedExtension.parsed || {}} style={{ padding: 25 }} />
                    </div>
                )}
            </AccordionContent>
        </>
    );
}

function TokenExtensionStateHeader({ name }: { name: string }) {
    return (
        <tr>
            <th className="text-muted w-1">{name}</th>
            <th className="text-muted"></th>
        </tr>
    );
}

function ExtensionListItem({ ext }: { ext: ParsedTokenExtension }) {
    return (
        <div className="w-100 e-w-100 text-white e-flex e-items-center e-gap-2 e-text-sm">
            {/* Name */}
            <div className="e-flex e-min-w-80 e-items-center e-gap-2 e-whitespace-nowrap e-font-normal">
                <span>{ext.name}</span>
                <TokenExtensionBadge extension={ext} />
            </div>

            {/* Description */}
            <div className="e-flex-1 e-text-[0.75rem] e-text-[#8E9090] e-underline e-decoration-[#1e2423] max-lg:e-hidden">
                {ext.description ?? null}
            </div>
        </div>
    );
}

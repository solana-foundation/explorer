import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@components/shared/ui/accordion';
import { SyntheticEvent, useCallback, useMemo, useRef, useState } from 'react';
import { Code, ExternalLink } from 'react-feather';
import ReactJson from 'react-json-view';

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
    const accordionTriggerRef = useRef<HTMLButtonElement>(null);

    const handleToggleRaw = useCallback(() => {
        onSelect(parsedExtension.extension);
        setShowRaw(!showRaw);
    }, [showRaw, onSelect, parsedExtension.extension]);

    const tableHeaderComponent = useMemo(() => {
        return TokenExtensionStateHeader({ name: parsedExtension.name });
    }, [parsedExtension.name]);

    return (
        <>
            <AccordionTrigger className="e-items-center" ref={accordionTriggerRef}>
                <ExtensionListItem ext={parsedExtension} onToggleRaw={handleToggleRaw} raw={showRaw} />
            </AccordionTrigger>
            <AccordionContent>
                {!showRaw ? (
                    <div className="card e-m-4">
                        <TableCardBodyHeaded headerComponent={tableHeaderComponent}>
                            {TokenExtensionRow(extension, undefined, decimals, symbol, 'omit')}
                        </TableCardBodyHeaded>
                    </div>
                ) : (
                    <div className="e-p-4">
                        <ReactJson src={parsedExtension.parsed || {}} theme={'solarized'} style={{ padding: 25 }} />
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

function ExtensionListItem({
    ext,
    onToggleRaw,
    raw,
}: {
    ext: ParsedTokenExtension;
    onToggleRaw: () => void;
    raw: boolean;
}) {
    const handleToggleRaw = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.stopPropagation();
            onToggleRaw();
        },
        [onToggleRaw]
    );

    return (
        <div className="w-100 e-w-100 text-white e-grid e-grid-cols-12-ext e-items-center e-gap-2 e-text-sm">
            {/* Name */}
            <div className="e-flex e-min-w-80 e-items-center e-gap-2 e-whitespace-nowrap e-font-normal max-xs:e-col-span-6 xs:e-col-span-6 sm:e-col-span-6 md:e-col-span-4 lg:e-col-span-3">
                <div>{ext.name}</div>
                <TokenExtensionBadge extension={ext} />
            </div>

            {/* Description */}
            <span className="e-text-[0.75rem] e-text-[#8E9090] e-underline e-decoration-[#1e2423] max-md:e-hidden md:e-col-span-6 md:e-pl-12 lg:e-col-span-7">
                {ext.description ?? null}
            </span>

            {/* External links badges */}
            <div className="text-white e-flex e-justify-end e-gap-1 max-xs:e-col-span-6 xs:e-col-span-6 sm:e-col-span-6 md:e-col-span-2 lg:e-col-span-2">
                <a key="raw" href="javascript:void(0)" onClick={handleToggleRaw}>
                    <Badge
                        className="text-white e-font-normal"
                        as="link"
                        size="sm"
                        status={raw ? 'active' : 'inactive'}
                        variant="transparent"
                    >
                        <Code size={16} /> Raw
                    </Badge>
                </a>
                {ext.externalLinks.map((link, index) => (
                    <a key={index} href={link.url} target="_blank" rel="noopener noreferrer">
                        <Badge variant="transparent" size="sm" as="link" className="text-white e-font-normal">
                            <ExternalLink size={16} />
                            {link.label}
                        </Badge>
                    </a>
                ))}
            </div>
        </div>
    );
}

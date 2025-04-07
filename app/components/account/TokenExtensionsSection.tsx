import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@components/shared/ui/accordion';
import { SyntheticEvent, useCallback, useMemo, useRef, useState } from 'react';
import { Code, ExternalLink } from 'react-feather';
import ReactJson from 'react-json-view';

import { TableCardBodyHeaded } from '@/app/components/common/TableCardBody';
import { StatusBadge } from '@/app/components/shared/StatusBadge';
import { Badge } from '@/app/components/shared/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';
import { TokenExtension } from '@/app/validators/accounts/token-extension';

import { TokenExtensionRow } from './TokenAccountSection';
import { ParsedTokenExtensionWithRawData } from './TokenExtensionsCard';

export function TokenExtensionsSection({
    extensions,
    parsedExtensions,
}: {
    extensions: TokenExtension[];
    parsedExtensions: ParsedTokenExtensionWithRawData[];
}) {
    const [selectedExtension, setSelectedExtension] = useState<string | undefined>(undefined);

    const onSelect = useCallback(
        (id: string) => {
            setSelectedExtension(id === selectedExtension ? undefined : id);
        },
        [selectedExtension]
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
                    return extension === ext.id;
                });

                return (
                    <AccordionItem key={ext.id} value={ext.id} onClick={handleSelect}>
                        {extension && (
                            <TokenExtensionAccordionItem
                                extension={extension}
                                parsedExtension={ext}
                                onSelect={onSelect}
                            />
                        )}
                    </AccordionItem>
                );
            })}
        </Accordion>
    );
}

function TokenExtensionAccordionItem({
    extension,
    parsedExtension,
    onSelect,
}: {
    extension: TokenExtension;
    parsedExtension: ParsedTokenExtensionWithRawData;
    onSelect: (id: string) => void;
}) {
    const [showRaw, setShowRaw] = useState(false);
    const accordionTriggerRef = useRef<HTMLButtonElement>(null);

    const handleToggleRaw = useCallback(() => {
        onSelect(parsedExtension.id);
        setShowRaw(!showRaw);
    }, [showRaw, onSelect, parsedExtension.id]);

    const tableHeaderComponent = useMemo(() => {
        return TokenExtensionStateHeader({ name: parsedExtension.name });
    }, [parsedExtension.name]);

    return (
        <>
            <AccordionTrigger className="e-items-center" ref={accordionTriggerRef}>
                <ExtensionListItem ext={parsedExtension} onToggleRaw={handleToggleRaw} />
            </AccordionTrigger>
            <AccordionContent>
                {!showRaw ? (
                    <div className="card e-m-4">
                        <TableCardBodyHeaded headerComponent={tableHeaderComponent}>
                            {TokenExtensionRow(extension, undefined, 6, undefined, 'omit')}
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

function ExtensionListItem({ ext, onToggleRaw }: { ext: ParsedTokenExtensionWithRawData; onToggleRaw: () => void }) {
    const handleToggleRaw = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.stopPropagation();
            onToggleRaw();
        },
        [onToggleRaw]
    );

    return (
        <div className="w-100 e-w-100 text-white e-grid e-grid-cols-12 e-items-center e-gap-2 e-text-sm">
            {/* Name */}
            <div className="e-flex e-items-center e-gap-2 e-whitespace-nowrap e-font-normal max-xs:e-col-span-6 xs:e-col-span-6 sm:e-col-span-6 md:e-col-span-3 lg:e-col-span-3">
                <div>{ext.name}</div>
                <Tooltip>
                    {/* might be needed to wrap tooltip into a wrapper that watches window borders to adjust tootip's position */}
                    <TooltipTrigger className="badge border-0 bg-transparent">
                        <StatusBadge status={ext.status} label={ext.name} className="e-text-14" />
                    </TooltipTrigger>
                    {ext.tooltip && (
                        <TooltipContent>
                            <div className="e-w-[220px]">{ext.tooltip}</div>
                        </TooltipContent>
                    )}
                </Tooltip>
            </div>

            {/* Description */}
            <span className="e-text-[0.75rem] e-text-[#8E9090] max-md:e-hidden md:e-col-span-7 md:e-pl-4 lg:e-col-span-7">
                {ext.description ?? null}
            </span>

            {/* External links badges */}
            <div className="text-white xs:e-grid-col-span-6 e-flex e-justify-end e-gap-1 max-xs:e-col-span-6 xs:e-col-span-6 sm:e-col-span-6 md:e-col-span-2 lg:e-col-span-2">
                <a key="raw" href="javascript:void(0)" onClick={handleToggleRaw}>
                    <Badge variant="transparent" size="sm" className="text-white e-font-normal">
                        <Code size={16} /> Raw
                    </Badge>
                </a>
                {ext.externalLinks.map((link, index) => (
                    <a key={index} href={link.url} target="_blank" rel="noopener noreferrer">
                        <Badge variant="transparent" size="sm" className="text-white e-font-normal">
                            <ExternalLink size={16} />
                            {link.label}
                        </Badge>
                    </a>
                ))}
            </div>
        </div>
    );
}

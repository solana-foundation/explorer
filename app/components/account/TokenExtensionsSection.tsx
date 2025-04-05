import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@components/shared/ui/accordion';
import { PublicKey } from '@solana/web3.js';
import { SyntheticEvent, useCallback, useRef, useState } from 'react';
import { Code, ExternalLink } from 'react-feather';
import ReactJson from 'react-json-view';

import { StatusBadge } from '@/app/components/shared/StatusBadge';
import { Badge } from '@/app/components/shared/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';

import { Address } from '../common/Address';
import { ParsedTokenExtensionWithRawData } from './TokenExtensionsCard';

export function TokenExtensionsSection({ extensions }: { extensions: ParsedTokenExtensionWithRawData[] }) {
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
            {extensions.map(ext => (
                <AccordionItem key={ext.id} value={ext.id} onClick={handleSelect}>
                    <TokenExtensionAccordionItem ext={ext} onSelect={onSelect} />
                </AccordionItem>
            ))}
        </Accordion>
    );
}

function TokenExtensionAccordionItem({
    ext,
    onSelect,
}: {
    ext: ParsedTokenExtensionWithRawData;
    onSelect: (id: string) => void;
}) {
    const [showRaw, setShowRaw] = useState(false);
    const accordionTriggerRef = useRef<HTMLButtonElement>(null);

    const handleToggleRaw = useCallback(() => {
        onSelect(ext.id);
        setShowRaw(!showRaw);
    }, [showRaw, onSelect, ext.id]);

    return (
        <>
            <AccordionTrigger className="e-items-center" ref={accordionTriggerRef}>
                <ExtensionListItem ext={ext} onToggleRaw={handleToggleRaw} />
            </AccordionTrigger>
            <AccordionContent>
                {!showRaw ? (
                    <TokenExtensionParsedData data={ext.parsed} name={ext.name} />
                ) : (
                    <div className="e-p-4">
                        <ReactJson src={ext.raw || {}} theme={'solarized'} style={{ padding: 25 }} />
                    </div>
                )}
            </AccordionContent>
        </>
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
        <div className="w-100 e-w-100 text-white e-grid e-grid-cols-12 e-items-center e-gap-2 e-text-base e-text-sm">
            {/* Name */}
            <div className="e-flex e-items-center e-gap-2 e-whitespace-nowrap e-font-normal max-xs:e-col-span-6 xs:e-col-span-6 xs:e-col-span-6 sm:e-col-span-6 md:e-col-span-3 lg:e-col-span-3">
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

function TokenExtensionParsedData({ data, name }: { data: ParsedTokenExtensionWithRawData['parsed']; name: string }) {
    return (
        <div className="card e-m-4">
            {Array.isArray(data) ? (
                data.map(([name, data]) => <TokenExtensionParsedDataSection key={name} name={name} data={data} />)
            ) : data ? (
                <TokenExtensionParsedDataSection name={name} data={data} />
            ) : null}
        </div>
    );
}

function TokenExtensionParsedDataSection({
    name,
    data,
}: {
    name: string;
    data: NonNullable<{ [key: string]: [] | string | number }>;
}) {
    return (
        <div className="table-responsive mb-0">
            <table className="table table-sm table-nowrap card-table">
                <thead>
                    <tr>
                        <th className="text-muted w-1">{name}</th>
                        <th className="text-muted"></th>
                    </tr>
                </thead>
                <tbody className="list">
                    {Object.entries(data).map(([key, value], index) => (
                        <tr key={key + index}>
                            <td>{key}</td>

                            <td>
                                {value instanceof PublicKey ? (
                                    <Address pubkey={value} link />
                                ) : value instanceof Object ? (
                                    <span>{JSON.stringify(value)}</span>
                                ) : (
                                    <span>{value}</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

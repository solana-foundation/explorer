import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@components/shared/ui/accordion';
import { Code, ExternalLink } from 'react-feather';

import { StatusBadge } from '@/app/components/shared/StatusBadge';
import { Badge } from '@/app/components/shared/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';

import { ParsedTokenExtensionWithRawData } from './TokenExtensionsCard';

export function TokenExtensionsSection({ extensions }: { extensions: ParsedTokenExtensionWithRawData[] }) {
    return (
        <Accordion type="single" collapsible className="e-px-0">
            {extensions.map(ext => (
                <AccordionItem key={ext.id} value={ext.id}>
                    {/* customize classes to align chevron with inner row */}
                    <AccordionTrigger className="e-items-center">
                        <ExtensionListItem ext={ext} />
                    </AccordionTrigger>
                    <AccordionContent>
                        {/* Additional details can be added here if needed */}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}

function ExtensionListItem({ ext }: { ext: ParsedTokenExtensionWithRawData }) {
    return (
        <div className="w-100 e-grid e-grid-cols-12 e-gap-2 e-w-100 e-items-center text-white e-text-base e-text-sm">
            {/* Name */}
            <div className="max-xs:e-col-span-6 xs:e-col-span-6 sm:e-col-span-6 md:e-col-span-3 lg:e-col-span-3 e-flex e-items-center e-gap-2 e-whitespace-nowrap e-font-normal xs:e-col-span-6">
                <div>{ext.name}</div>
                {ext.tooltip && (
                    <Tooltip>
                        {/* might be needed to wrap tooltip into a wrapper that watches window borders to adjust tootip's position */}
                        <TooltipTrigger className="badge border-0 bg-transparent">
                        <StatusBadge status={ext.status} label={ext.name} className="e-text-14" />
                    </TooltipTrigger>
                    <TooltipContent className="e-w-[220px]">{ext.tooltip}</TooltipContent>
                </Tooltip>)}
            </div>

            {/* Description */}
            <span className="max-md:e-hidden md:e-col-span-7 md:e-pl-4 lg:e-col-span-7 e-text-[0.75rem] e-text-[#8E9090]">
                {ext.description ?? null}
            </span>

            {/* External links badges */}
            <div className="max-xs:e-col-span-6 xs:e-col-span-6 sm:e-col-span-6 md:e-col-span-2 lg:e-col-span-2 e-flex e-gap-1 text-white e-justify-end xs:e-grid-col-span-6">
                <a key="raw" href="javascript:void(0)" target="_blank" rel="noopener noreferrer">
                    <Badge variant="transparent" size='sm' className="text-white e-font-normal"><Code size={16}/> Raw</Badge>
                </a>
                {ext.externalLinks.map((link, index) => (
                    <a key={index} href={link.url} target="_blank" rel="noopener noreferrer">
                        <Badge variant="transparent" size='sm' className="text-white e-font-normal"><ExternalLink size={16} />{link.label}</Badge>
                    </a>
                ))}
            </div>
        </div>
    );
}

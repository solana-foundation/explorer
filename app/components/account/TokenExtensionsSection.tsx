import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@components/shared/ui/accordion';

import { Badge } from '@/app/components/shared/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';
import { StatusBadge } from '@/app/components/shared/StatusBadge';

import { TokenExtension } from './TokenExtensionsCard';

export function TokenExtensionsSection({ extensions }: { extensions: TokenExtension[] }) {
    return (
        <Accordion type="single" collapsible>
            {extensions.map(ext => (
                <AccordionItem key={ext.id} value={ext.id}>
                    {/* customize classes to align chevron with inner row */}
                    <AccordionTrigger className='fs-4 e:items-center' >
                        <ExtensionListItem ext={ext} />
                    </AccordionTrigger>
                    <AccordionContent>
                        234234
                        {/* Additional details can be added here if needed */}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}

function ExtensionListItem({ ext }: { ext: TokenExtension }) {
    return (
        <div className="e:grid e:grid-cols-4 e:gap-4 e:w-100 e:items-center text-white e:text-base">
            {/* Name */}
            <span className="font-medium">{ext.name}</span>

            {/* Badge with tooltip */}
            <div className="">
                <Tooltip>
                    <TooltipTrigger className='badge border-0 bg-transparent'>
                        <StatusBadge status={ext.status} label={ext.name} className="e:text-14" />
                    </TooltipTrigger>
                    <TooltipContent>{ext.tooltip}</TooltipContent>
                </Tooltip>
            </div>

            {/* Description */}
            <span className="text-sm">{ext.description}</span>

            {/* External links badges */}
            <div className="flex gap-1">
                {ext.externalLinks.map((link, index) => (
                    <a key={index} href={link.url} target="_blank" rel="noopener noreferrer">
                        <Badge className="text-[10px]">
                            {link.label}
                        </Badge>
                    </a>
                ))}
            </div>
        </div>
    );
}

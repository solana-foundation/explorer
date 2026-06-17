'use client';

import { displayTimestamp, displayTimestampUtc } from '@utils/date';
import { useState } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';

export function TimestampToggle({ unixTimestamp, shorter }: { unixTimestamp: number; shorter?: boolean }) {
    const [isUtc, setIsUtc] = useState(true);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="w-full cursor-pointer" onClick={() => setIsUtc(prev => !prev)}>
                    {isUtc ? displayTimestampUtc(unixTimestamp, shorter) : displayTimestamp(unixTimestamp, shorter)}
                </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-80">
                (Click to toggle between local and UTC)
            </TooltipContent>
        </Tooltip>
    );
}

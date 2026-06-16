import { Badge } from '@shared/ui/badge';
import { ExternalLink } from 'react-feather';

import { Copyable } from '@/app/components/common/Copyable';

export function TxSuccessStatus({ signature, date, link }: { signature: string; date: Date; link: string }) {
    const time = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
    });
    const timestamp = `${time} UTC`;

    return (
        <div className="border-1 flex items-center gap-2 rounded border border-solid border-neutral-600 px-4 py-2">
            <div className="flex w-1/2 items-center gap-1">
                <Copyable text={signature}>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm tracking-tight text-accent-700">
                        {signature}
                    </span>
                </Copyable>
            </div>
            <div className="flex items-center">
                <span className="whitespace-nowrap text-xs tracking-tight text-accent-700">{timestamp}</span>
            </div>
            <a href={link} target="_blank" rel="noopener noreferrer" className="ml-auto">
                <Badge variant="success" size="xs">
                    Success <ExternalLink size={12} />
                </Badge>
            </a>
        </div>
    );
}

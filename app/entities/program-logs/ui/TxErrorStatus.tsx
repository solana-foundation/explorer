import { Badge } from '@components/shared/ui/badge';
import { ExternalLink } from 'react-feather';

import { Copyable } from '@/app/components/common/Copyable';

export function TxErrorStatus({ message, date, link }: { message: string | null; date: Date; link: string | null }) {
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
            {message && (
                <div className="flex w-1/2 items-center gap-1">
                    <Copyable text={message}>
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm tracking-tight text-destructive">
                            {message}
                        </span>
                    </Copyable>
                </div>
            )}

            <div className="flex items-center">
                <span className="whitespace-nowrap text-xs tracking-tight text-destructive">{timestamp}</span>
            </div>
            {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className="ml-auto">
                    <Badge variant="destructive" size="xs" className="ml-auto">
                        Error <ExternalLink size={12} />
                    </Badge>
                </a>
            ) : (
                <Badge variant="destructive" size="xs" className="ml-auto">
                    Error
                </Badge>
            )}
        </div>
    );
}

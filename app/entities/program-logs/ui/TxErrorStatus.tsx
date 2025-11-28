import { Badge } from '@shared/ui/badge';
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
        <div className="e-border-1 e-flex e-items-center e-gap-4 e-rounded e-border e-border-solid e-border-neutral-600 e-px-4 e-py-2">
            {message && (
                <div className="e-flex e-w-1/2 e-items-center e-gap-1">
                    <Copyable text={message}>
                        <span className="e-overflow-hidden e-text-ellipsis e-whitespace-nowrap e-font-mono e-text-sm e-tracking-tight e-text-destructive">
                            {message}
                        </span>
                    </Copyable>
                </div>
            )}

            <div className="e-flex e-items-center">
                <span className="e-text-xs e-tracking-tight e-text-destructive">{timestamp}</span>
            </div>
            {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className="e-ml-auto">
                    <Badge variant="destructive" size="xs" className="e-ml-auto">
                        Error <ExternalLink size={12} />
                    </Badge>
                </a>
            ) : (
                <Badge variant="destructive" size="xs" className="e-ml-auto">
                    Error
                </Badge>
            )}
        </div>
    );
}

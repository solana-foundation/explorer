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
        <div className="e-border-1 e-flex e-items-center e-gap-4 e-rounded e-border e-border-solid e-border-neutral-600 e-px-4 e-py-2">
            <div className="e-flex e-w-1/2 e-items-center e-gap-1">
                <Copyable text={signature}>
                    <span className="e-overflow-hidden e-text-ellipsis e-whitespace-nowrap e-font-mono e-text-sm e-tracking-tight e-text-accent-700">
                        {signature}
                    </span>
                </Copyable>
            </div>
            <div className="e-flex e-items-center">
                <span className="e-text-xs e-tracking-tight e-text-accent-700">{timestamp}</span>
            </div>
            <a href={link} target="_blank" rel="noopener noreferrer" className="e-ml-auto">
                <Badge variant="success" size="xs">
                    Success <ExternalLink size={12} />
                </Badge>
            </a>
        </div>
    );
}

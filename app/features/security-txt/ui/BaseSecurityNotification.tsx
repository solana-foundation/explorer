import { MessageCircle } from 'react-feather';

import { Card } from '@/app/shared/ui/Card';

export function BaseSecurityNotification({ message }: { message: string }) {
    return (
        <Card ui="dashkit" className="px-6 py-5">
            <div className="flex flex-row items-start gap-2">
                <MessageCircle className="shrink-0 text-xs text-accent" />
                <div>
                    <h3 className="mb-1 text-sm font-normal text-white">Notification from security.txt</h3>
                    <p className="m-0 whitespace-pre-wrap text-xs text-neutral-400">{message}</p>
                </div>
            </div>
        </Card>
    );
}

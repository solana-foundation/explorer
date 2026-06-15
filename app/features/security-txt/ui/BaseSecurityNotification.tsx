import { MessageCircle } from 'react-feather';

import { Card } from '@/app/shared/ui/Card';

export function BaseSecurityNotification({ message }: { message: string }) {
    return (
        <Card ui="dashkit" className="e-px-6 e-py-5">
            <div className="e-flex e-flex-row e-items-start e-gap-2">
                <MessageCircle className="e-shrink-0 e-text-xs e-text-accent" />
                <div>
                    <h3 className="e-mb-1 e-text-sm e-font-normal e-text-white">Notification from security.txt</h3>
                    <p className="e-m-0 e-whitespace-pre-wrap e-text-xs e-text-neutral-400">{message}</p>
                </div>
            </div>
        </Card>
    );
}

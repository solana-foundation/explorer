'use client';

import { Switch } from '@components/shared/ui/switch';
import { customUrlEnabledAtom } from '@entities/cluster';
import { useAtom } from 'jotai';
import { useState } from 'react';

import { CustomUrlConsentDialog } from './CustomUrlConsentDialog';

export function ClusterModalDeveloperSettings() {
    const [enabled, setEnabled] = useAtom(customUrlEnabledAtom);
    const [confirming, setConfirming] = useState(false);

    const onCheckedChange = (next: boolean) => {
        // Turning it off needs no confirmation: it only ever makes the app ask more often. Turning it on
        // grants a standing permission for every link the browser opens, so it is confirmed once.
        if (!next) {
            setEnabled(false);
            return;
        }
        setConfirming(true);
    };

    return (
        <div className="selection:bg-accent selection:text-dark-background">
            <hr />
            <h2 className="mb-6 mt-6 text-center">Developer Settings</h2>
            <div className="flex items-center justify-between">
                <label htmlFor="cardToggle" className="mr-3 cursor-pointer">
                    Trust any custom url param
                </label>
                <Switch size="lg" id="cardToggle" checked={enabled} onCheckedChange={onCheckedChange} />
            </div>
            <p className="mt-3 text-dk-gray-700">
                Connect to any RPC endpoint from a &ldquo;customUrl&rdquo; url param without being asked first. Leave
                this off unless you are testing against your own endpoints.
            </p>

            <CustomUrlConsentDialog
                request={confirming ? { kind: 'developer-bypass' } : undefined}
                onConfirm={() => {
                    setEnabled(true);
                    setConfirming(false);
                }}
                onCancel={() => setConfirming(false)}
            />
        </div>
    );
}

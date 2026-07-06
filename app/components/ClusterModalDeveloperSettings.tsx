'use client';

import { Switch } from '@components/shared/ui/switch';
import { customUrlEnabledAtom } from '@providers/cluster';
import { useAtom } from 'jotai';

export default function ClusterModalDeveloperSettings() {
    const [enabled, setEnabled] = useAtom(customUrlEnabledAtom);

    return (
        <>
            <hr />
            <h2 className="mb-6 mt-6 text-center">Developer Settings</h2>
            <div className="flex items-center justify-between">
                <label htmlFor="cardToggle" className="mr-3 cursor-pointer">
                    Enable custom url param
                </label>
                <Switch size="lg" id="cardToggle" checked={enabled} onCheckedChange={setEnabled} />
            </div>
            <p className="mt-3 text-dk-gray-700">
                Enable this setting to easily connect to a custom cluster via the &ldquo;customUrl&rdquo; url param.
            </p>
        </>
    );
}

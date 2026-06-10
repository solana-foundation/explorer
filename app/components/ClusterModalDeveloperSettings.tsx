'use client';

import { Switch } from '@components/shared/ui/switch';
import { localStorageIsAvailable } from '@utils/local-storage';
import { useState } from 'react';

export default function ClusterModalDeveloperSettings() {
    const showDeveloperSettings = localStorageIsAvailable();
    const initialEnabled = showDeveloperSettings && localStorage.getItem('enableCustomUrl') !== null;
    const [enabled, setEnabled] = useState(initialEnabled);

    if (showDeveloperSettings !== true) {
        return null;
    }

    const onToggleCustomUrlFeature = (checked: boolean) => {
        setEnabled(checked);
        if (checked) {
            localStorage.setItem('enableCustomUrl', '');
        } else {
            localStorage.removeItem('enableCustomUrl');
        }
    };

    return (
        <>
            <hr />
            <h2 className="e-mb-6 e-mt-6 e-text-center">Developer Settings</h2>
            <div className="e-flex e-items-center e-justify-between">
                <label htmlFor="cardToggle" className="e-mr-3 e-cursor-pointer">
                    Enable custom url param
                </label>
                <Switch id="cardToggle" checked={enabled} onCheckedChange={onToggleCustomUrlFeature} />
            </div>
            <p className="e-mt-3 e-text-dk-gray-700">
                Enable this setting to easily connect to a custom cluster via the &ldquo;customUrl&rdquo; url param.
            </p>
        </>
    );
}

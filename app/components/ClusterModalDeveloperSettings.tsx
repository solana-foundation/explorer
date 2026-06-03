import { localStorageIsAvailable } from '@utils/local-storage';
import { ChangeEvent } from 'react';

export default function ClusterModalDeveloperSettings() {
    const showDeveloperSettings = localStorageIsAvailable();
    const enableCustomUrl = showDeveloperSettings && localStorage.getItem('enableCustomUrl') !== null;
    const onToggleCustomUrlFeature = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            localStorage.setItem('enableCustomUrl', '');
        } else {
            localStorage.removeItem('enableCustomUrl');
        }
    };
    if (showDeveloperSettings !== true) {
        return null;
    }
    return (
        <>
            <hr />
            <h2 className="text-center e-mb-6 e-mt-6">Developer Settings</h2>
            <div className="e-flex e-justify-between">
                <span className="e-mr-3">Enable custom url param</span>
                <div className="form-check form-switch">
                    <input
                        type="checkbox"
                        defaultChecked={enableCustomUrl}
                        className="form-check-input"
                        id="cardToggle"
                        onChange={onToggleCustomUrlFeature}
                    />
                    <label className="form-check-label" htmlFor="cardToggle"></label>
                </div>
            </div>
            <p className="text-muted e-mt-3">
                Enable this setting to easily connect to a custom cluster via the &ldquo;customUrl&rdquo; url param.
            </p>
        </>
    );
}

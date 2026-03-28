import { ComponentType, ReactNode } from 'react';
import { Download, IconProps } from 'react-feather';

import { triggerDownload } from '@/app/shared/lib/triggerDownload';

export function DownloadableIcon({
    data,
    filename,
    children,
}: {
    data: string;
    filename: string;
    children: ReactNode;
}) {
    const handleClick = () => triggerDownload(data, filename);

    return (
        <>
            <Download className="c-pointer me-2" onClick={handleClick} size={15} />
            {children}
        </>
    );
}

export function DownloadableButton({
    data,
    filename,
    children,
    type,
    icon: Icon = Download as ComponentType<IconProps>,
}: {
    data: string;
    filename: string;
    children?: ReactNode;
    type?: string;
    icon?: ComponentType<IconProps>;
}) {
    const handleDownload = () => triggerDownload(data, filename, { type });

    return (
        <div onClick={handleDownload} style={{ alignItems: 'center', cursor: 'pointer', display: 'inline-flex' }}>
            <Icon className="me-2" size={15} />
            {children}
        </div>
    );
}

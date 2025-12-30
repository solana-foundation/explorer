import { ComponentType, ReactNode } from 'react';
import { Download, IconProps } from 'react-feather';

import { fromBase64 } from '@/app/shared/lib/bytes';

export function DownloadableIcon({
    data,
    filename,
    children,
}: {
    data: string;
    filename: string;
    children: ReactNode;
}) {
    const handleClick = async () => {
        const blob = new Blob([fromBase64(data)]);
        const fileDownloadUrl = URL.createObjectURL(blob);
        const tempLink = document.createElement('a');
        tempLink.href = fileDownloadUrl;
        tempLink.setAttribute('download', filename);
        tempLink.click();
    };

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
    const handleDownload = async () => {
        const blob = new Blob([fromBase64(data)], type ? { type } : {});
        const fileDownloadUrl = URL.createObjectURL(blob);
        const tempLink = document.createElement('a');
        tempLink.href = fileDownloadUrl;
        tempLink.setAttribute('download', filename);
        tempLink.click();
    };

    return (
        <div onClick={handleDownload} style={{ alignItems: 'center', cursor: 'pointer', display: 'inline-flex' }}>
            <Icon className="me-2" size={15} />
            {children}
        </div>
    );
}

import { type ByteArray, encodeTransactionData, type EncodingFormat } from '@entities/transaction-data';
import dynamic from 'next/dynamic';
import { ComponentType, createRef, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Download, IconProps } from 'react-feather';

import { triggerDownload, triggerDownloadText } from '@/app/shared/lib/triggerDownload';

import { Button } from '../shared/ui/button';
import type { DropdownProps } from './Dropdown';

const Dropdown = dynamic<DropdownProps>(() => import('./Dropdown').then(m => m.Dropdown), { ssr: false });

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

export function DownloadableDropdown({
    data,
    encodings = ['hex', 'base58', 'base64'],
    filename,
}: {
    filename: string;
    data: ByteArray | null;
    encodings?: EncodingFormat[];
}) {
    const dropdownRef = createRef<HTMLButtonElement>();
    const dropdownOptions = useMemo(
        () => ({
            popperConfig() {
                return { strategy: 'fixed' as const };
            },
        }),
        []
    );

    return (
        <Dropdown dropdownRef={dropdownRef} options={dropdownOptions}>
            <div className="dropdown e-overflow-visible">
                <Button variant="outline" size="sm" ref={dropdownRef} data-bs-toggle="dropdown" type="button">
                    <Download size={12} />
                    Download
                </Button>
                <div className="dropdown-menu-end dropdown-menu e-z-10">
                    <div className="d-flex e-flex-col">
                        {encodings.map(encoding => (
                            <DownloadableDropdownButton
                                key={encoding}
                                data={data}
                                encoding={encoding}
                                filename={filename}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </Dropdown>
    );
}

function DownloadableDropdownButton({
    data,
    encoding,
    filename,
}: {
    data: ByteArray | null;
    encoding: EncodingFormat;
    filename: string;
}) {
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const proceedDownload = useCallback(
        (encoding: EncodingFormat) => {
            if (!data) return;

            const encoded = encodeTransactionData(data, encoding);
            triggerDownloadText(encoded, `${filename}_${encoding}.txt`);
        },
        [data, filename]
    );

    const handleDownload = (encoding: EncodingFormat) => {
        if (!data) {
            setIsLoading(true);
            return;
        }
        proceedDownload(encoding);
    };

    useEffect(() => {
        if (data && isLoading) {
            proceedDownload(encoding);
            setIsLoading(false);
        }
    }, [isLoading, data, encoding, proceedDownload]);

    return <Button onClick={() => handleDownload(encoding)}>Download {encoding}</Button>;
}

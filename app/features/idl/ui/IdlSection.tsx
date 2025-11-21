'use client';

import { useDebounceCallback } from '@react-hook/debounce';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Switch } from '@shared/ui/switch';
import { useMemo, useState } from 'react';
import { Code, Download, Search } from 'react-feather';

import { triggerDownload } from '@/app/shared/lib/triggerDownload';

import { IdlRenderer } from './IdlRenderer';

export function IdlSection({ idl, badge, programId }: { idl: any; badge: React.ReactNode; programId: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRawIdlView, setIsRawIdlView] = useState(false);
    const [searchStr, setSearchStr] = useState('');

    const onSearchIdl = useDebounceCallback((str: string) => {
        setSearchStr(str);
    }, 1000);

    const idlBase64 = useMemo(() => {
        return Buffer.from(JSON.stringify(idl, null, 2)).toString('base64');
    }, [idl]);

    const handleDownloadIdl = () => triggerDownload(idlBase64, `${programId}-idl.json`);

    return (
        <>
            <div className="e-flex e-min-h-9 e-flex-wrap e-items-center e-justify-between e-gap-2">
                {badge}
                <div className="e-flex e-flex-wrap e-items-center e-gap-4">
                    {isRawIdlView ? (
                        <>
                            <Switch id="expand-json" checked={isExpanded} onCheckedChange={setIsExpanded} />
                            <Label htmlFor="expand-json" className="e-cursor-pointer e-text-xs e-text-white">
                                Expand JSON
                            </Label>
                        </>
                    ) : (
                        <div className="e-relative e-flex-grow">
                            <Search className="e-absolute e-left-3 e-top-0 e-h-4 e-w-4 e-translate-y-1/2 e-text-neutral-300" />
                            <Input
                                placeholder="Search..."
                                variant="dark"
                                className="e-pl-9"
                                onChange={e => onSearchIdl(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="e-flex e-items-center e-gap-2">
                        <Button variant="outline" size="sm" onClick={handleDownloadIdl}>
                            <Download size={12} />
                            Download
                        </Button>

                        <Button
                            variant={isRawIdlView ? 'accent' : 'outline'}
                            size="sm"
                            onClick={() => setIsRawIdlView(!isRawIdlView)}
                        >
                            <Code size={12} />
                            RAW
                        </Button>
                    </div>
                </div>
            </div>

            <div className="e-mt-4 e-min-h-48">
                <IdlRenderer
                    idl={idl}
                    collapsed={!isExpanded}
                    raw={isRawIdlView}
                    searchStr={searchStr}
                    programId={programId}
                />
            </div>
        </>
    );
}

import type { SupportedIdl } from '@entities/idl';
import { Button } from '@shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@shared/ui/dialog';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Switch } from '@shared/ui/switch';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Code, Download, ExternalLink, Search } from 'react-feather';

import { WalletProvider } from '@/app/providers/wallet-provider';
import { fromUtf8, toBase64 } from '@/app/shared/lib/bytes';
import { triggerDownload } from '@/app/shared/lib/triggerDownload';

import { type IdlVariant } from '../model/use-idl-last-transaction-date';
import { IdlRenderer } from './IdlRenderer';

export function IdlSection({
    idl,
    badge,
    programId,
    idlSource,
    network,
    searchStr,
    onSearchChange,
}: {
    idl: SupportedIdl;
    badge: React.ReactNode;
    programId: string;
    idlSource: IdlVariant;
    network: string;
    searchStr: string;
    onSearchChange: (str: string) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRawIdlView, setIsRawIdlView] = useState(false);
    const [isCastawayDialogOpen, setIsCastawayDialogOpen] = useState(false);
    const downloadDropdownRef = useRef<HTMLButtonElement>(null);

    const idlBase64 = useMemo(() => {
        return toBase64(fromUtf8(JSON.stringify(idl, null, 2)));
    }, [idl]);
    const castawayUrl = useMemo(() => {
        const params = new URLSearchParams({ idlSource, network, program: programId });
        return `https://www.castaway.lol/?${params.toString()}`;
    }, [idlSource, network, programId]);

    useEffect(() => {
        if (!downloadDropdownRef.current) {
            return;
        }

        let isMounted = true;
        let dropdown: { dispose: () => void } | null = null;

        void import('bootstrap/js/dist/dropdown').then(module => {
            if (!isMounted || !downloadDropdownRef.current) {
                return;
            }

            const BsDropdown = module.default;
            dropdown = new BsDropdown(downloadDropdownRef.current, {
                popperConfig() {
                    return { strategy: 'fixed' as const };
                },
            });
        });

        return () => {
            isMounted = false;
            dropdown?.dispose();
        };
    }, []);

    const handleDownloadIdl = () => triggerDownload(idlBase64, `${programId}-idl.json`);
    const handleOpenCastawayDialog = () => setIsCastawayDialogOpen(true);
    const handleCastawayContinue = () => {
        window.open(castawayUrl, '_blank', 'noopener,noreferrer');
        setIsCastawayDialogOpen(false);
    };

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
                                value={searchStr}
                                onChange={e => onSearchChange(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="e-flex e-items-center e-gap-2">
                        <div className="dropdown e-overflow-visible">
                            <Button
                                variant="outline"
                                size="sm"
                                ref={downloadDropdownRef}
                                data-bs-toggle="dropdown"
                                type="button"
                                aria-label="Download"
                            >
                                <Download size={12} />
                                Download
                            </Button>
                            <div className="dropdown-menu-end dropdown-menu e-z-10">
                                <div className="d-flex e-flex-col">
                                    <Button onClick={handleDownloadIdl}>Download IDL</Button>
                                    <Button onClick={handleOpenCastawayDialog}>Generate SDK</Button>
                                </div>
                            </div>
                        </div>

                        <Dialog open={isCastawayDialogOpen} onOpenChange={setIsCastawayDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="e-flex e-items-center e-gap-2">
                                        <AlertCircle className="e-text-destructive" size={16} />
                                        Leaving Solana Explorer
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="e-space-y-2 e-pl-6">
                                    <DialogDescription>
                                        You are now leaving Explorer and going to Castaway.
                                    </DialogDescription>
                                    <DialogDescription className="e-break-all e-font-mono e-text-xs">
                                        {castawayUrl}
                                    </DialogDescription>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline" size="sm">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button variant="default" size="sm" onClick={handleCastawayContinue}>
                                        Continue
                                        <ExternalLink size={12} />
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

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
                <WalletProvider skipToast autoConnect>
                    <IdlRenderer
                        idl={idl}
                        collapsed={!isExpanded}
                        raw={isRawIdlView}
                        searchStr={searchStr}
                        programId={programId}
                    />
                </WalletProvider>
            </div>
        </>
    );
}

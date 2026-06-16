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
import { Dropdown, DropdownMenu, DropdownToggle } from '@shared/ui/dropdown';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Switch } from '@shared/ui/switch';
import { useMemo, useState } from 'react';
import { AlertCircle, Code, Download, ExternalLink, Search } from 'react-feather';

import { WalletProvider } from '@/app/providers/wallet-provider';
import { fromUtf8, toBase64 } from '@/app/shared/lib/bytes';
import { triggerDownload } from '@/app/shared/lib/triggerDownload';

import { type IdlVariant } from '../model/use-idl-last-transaction-date';
import { IdlRenderer } from './IdlRenderer';

// FIXME: missing Storybook story — wraps content in WalletProvider.
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

    const idlBase64 = useMemo(() => {
        return toBase64(fromUtf8(JSON.stringify(idl, null, 2)));
    }, [idl]);
    const castawayUrl = useMemo(() => {
        const params = new URLSearchParams({ idlSource, network, program: programId });
        return `https://www.castaway.lol/?${params.toString()}`;
    }, [idlSource, network, programId]);

    const handleDownloadIdl = () => triggerDownload(idlBase64, `${programId}-idl.json`);
    const handleOpenCastawayDialog = () => setIsCastawayDialogOpen(true);
    const handleCastawayContinue = () => {
        window.open(castawayUrl, '_blank', 'noopener,noreferrer');
        setIsCastawayDialogOpen(false);
    };

    return (
        <>
            <div className="flex min-h-9 flex-wrap items-center justify-between gap-2">
                {badge}
                <div className="flex flex-wrap items-center gap-4">
                    {isRawIdlView ? (
                        <>
                            <Switch id="expand-json" checked={isExpanded} onCheckedChange={setIsExpanded} />
                            <Label htmlFor="expand-json" className="cursor-pointer text-xs text-white">
                                Expand JSON
                            </Label>
                        </>
                    ) : (
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-0 h-4 w-4 translate-y-1/2 text-neutral-300" />
                            <Input
                                placeholder="Search..."
                                variant="dark"
                                className="pl-9"
                                value={searchStr}
                                onChange={e => onSearchChange(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Dropdown className="overflow-visible">
                            <DropdownToggle asChild>
                                <Button variant="outline" size="sm" type="button" aria-label="Download">
                                    <Download size={12} />
                                    Download
                                </Button>
                            </DropdownToggle>
                            <DropdownMenu align="end" className="z-10">
                                <div className="flex flex-col">
                                    <Button onClick={handleDownloadIdl}>Download IDL</Button>
                                    <Button onClick={handleOpenCastawayDialog}>Generate SDK</Button>
                                </div>
                            </DropdownMenu>
                        </Dropdown>

                        <Dialog open={isCastawayDialogOpen} onOpenChange={setIsCastawayDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <AlertCircle className="text-destructive" size={16} />
                                        Leaving Solana Explorer
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-2 pl-6">
                                    <DialogDescription>
                                        You are now leaving Explorer and going to Castaway.
                                    </DialogDescription>
                                    <DialogDescription className="break-all font-mono text-xs">
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

            <div className="mt-4 min-h-48">
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

'use client';

import { useToast } from '@components/shared/ui/sonner/use-toast';
import { useCluster } from '@providers/cluster';
import { useSetAtom } from 'jotai';
import { useState } from 'react';

import { type StorageWriteResult } from '../api/custom-idl-storage';
import { removeCustomIdlAtom, setIdlSelectionAtom } from '../model/custom-idl/custom-idl-store';
import { type CustomIdlOrigin } from '../model/custom-idl/types';
import { useProgramIdls } from '../model/use-program-idls';
import { BaseIdlSourceSelect } from './BaseIdlSourceSelect';
import { CUSTOM_IDL_SAVE_FAILED_MESSAGE } from './custom-idl-messages';
import { CustomIdlUploadDialog } from './CustomIdlUploadDialog';

export function ProgramIdlSelector({ programAddress }: { programAddress: string }) {
    const { url, cluster } = useCluster();
    const { onChainIdls, stored } = useProgramIdls(programAddress, url, cluster);
    const setIdlSelection = useSetAtom(setIdlSelectionAtom);
    const removeCustomIdl = useSetAtom(removeCustomIdlAtom);
    const toast = useToast();
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const record = stored.status === 'ready' ? stored.record : undefined;
    // eslint-disable-next-line unicorn/no-null -- a React component returns null to render nothing
    if (!record) return null;

    const reportFailure = (result: StorageWriteResult) => {
        if (!result.ok) toast.custom({ title: CUSTOM_IDL_SAVE_FAILED_MESSAGE, type: 'error' });
    };

    return (
        <>
            <BaseIdlSourceSelect
                selected={record.selected}
                onChainSource={onChainIdls?.at(0)?.source}
                isOnChainLoading={onChainIdls === undefined}
                customIdlName={describeOrigin(record.origin)}
                onSelect={selected => void setIdlSelection({ programAddress, selected }).then(reportFailure)}
                onReplace={() => setIsUploadOpen(true)}
                onRemove={() => void removeCustomIdl(programAddress).then(reportFailure)}
            />
            <CustomIdlUploadDialog
                programAddress={programAddress}
                isReplacing
                open={isUploadOpen}
                onOpenChange={setIsUploadOpen}
            />
        </>
    );
}

function describeOrigin(origin: CustomIdlOrigin): string {
    return origin.kind === 'file' ? origin.fileName : 'Pasted JSON';
}

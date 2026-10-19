import { Button } from '@components/shared/ui/button';
import { useState } from 'react';
import { Upload } from 'react-feather';

import { CustomIdlUploadDialog } from './CustomIdlUploadDialog';

export function AddCustomIdlButton({ programAddress }: { programAddress: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <Button
                ui="dashkit"
                variant="white"
                size="sm"
                className="whitespace-nowrap"
                onClick={() => setIsOpen(true)}
            >
                <Upload className="mr-1.5" size={13} />
                Add custom IDL
            </Button>
            <CustomIdlUploadDialog
                programAddress={programAddress}
                isReplacing={false}
                open={isOpen}
                onOpenChange={setIsOpen}
            />
        </>
    );
}

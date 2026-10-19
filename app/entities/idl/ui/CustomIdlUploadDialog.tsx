import { Button } from '@components/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@components/shared/ui/dialog';
import { useId } from 'react';

import { CUSTOM_IDL_PRIVACY_NOTE } from './custom-idl-messages';
import { CustomIdlForm } from './CustomIdlForm';

export function CustomIdlUploadDialog({
    programAddress,
    isReplacing,
    open,
    onOpenChange,
}: {
    programAddress: string;
    isReplacing: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const formId = useId();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isReplacing ? 'Replace the custom IDL' : 'Add a custom IDL'}</DialogTitle>
                    <DialogDescription>{CUSTOM_IDL_PRIVACY_NOTE}</DialogDescription>
                </DialogHeader>
                <CustomIdlForm id={formId} programAddress={programAddress} onSaved={() => onOpenChange(false)} />
                <DialogFooter>
                    <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form={formId} size="sm">
                        {isReplacing ? 'Replace' : 'Add'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

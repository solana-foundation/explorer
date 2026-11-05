import { Button } from '@components/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@components/shared/ui/dialog';
import { useId, useState } from 'react';

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
    const [isSaving, setIsSaving] = useState(false);

    return (
        <Dialog
            open={open}
            onOpenChange={next => {
                if (!isSaving) onOpenChange(next);
            }}
        >
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isReplacing ? 'Replace the custom IDL' : 'Add a custom IDL'}</DialogTitle>
                </DialogHeader>
                <DialogDescription className="mb-2 mt-0 leading-relaxed">{CUSTOM_IDL_PRIVACY_NOTE}</DialogDescription>
                <CustomIdlForm
                    id={formId}
                    programAddress={programAddress}
                    onSaved={() => onOpenChange(false)}
                    onSavingChange={setIsSaving}
                />
                <DialogFooter className="gap-2 pt-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        disabled={isSaving}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" form={formId} size="lg" variant="accent" disabled={isSaving}>
                        {isReplacing ? 'Replace' : 'Add'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

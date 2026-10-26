import { Button } from '@components/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@components/shared/ui/dialog';
import { cn } from '@components/shared/utils';
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
        // Closing unmounts the form, so an error from a running save would not show.
        <Dialog
            open={open}
            onOpenChange={next => {
                if (!isSaving) onOpenChange(next);
            }}
        >
            <DialogContent className={CONTENT_CLASSES}>
                <DialogHeader className="!space-y-0 !text-left">
                    <DialogTitle className="!text-xl !font-medium !leading-snug">
                        {isReplacing ? 'Replace the custom IDL' : 'Add a custom IDL'}
                    </DialogTitle>
                </DialogHeader>
                <DialogDescription className="mb-2 mt-0 !text-[13px] leading-relaxed !text-white">
                    {CUSTOM_IDL_PRIVACY_NOTE}
                </DialogDescription>
                <CustomIdlForm
                    id={formId}
                    programAddress={programAddress}
                    onSaved={() => onOpenChange(false)}
                    onSavingChange={setIsSaving}
                />
                <DialogFooter className="!flex-row !justify-start gap-2 pt-1 sm:!space-x-0">
                    <Button type="submit" form={formId} size="lg" variant="accent" disabled={isSaving}>
                        {isReplacing ? 'Replace' : 'Add'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        disabled={isSaving}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// On phones the box keeps a side gutter and round corners, where the shared dialog box goes edge to edge.
const CONTENT_CLASSES = cn(
    '!w-[calc(100%-2rem)] !max-w-md !gap-3 !rounded-lg !border-outer-space-800 !bg-outer-space-900 !p-5 !pt-6',
    'max-h-[calc(100dvh-2rem)] overflow-y-auto',
);

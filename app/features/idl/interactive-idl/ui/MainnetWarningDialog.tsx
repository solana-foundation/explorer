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
import { AlertCircle, Send } from 'react-feather';

type MainnetWarningDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    onCancel: () => void;
};

export function MainnetWarningDialog({ open, onOpenChange, onConfirm, onCancel }: MainnetWarningDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="e-flex e-items-center e-gap-2">
                        <AlertCircle className="e-text-destructive" size={16} />
                        Spend real funds?
                    </DialogTitle>
                    <DialogDescription className="e-pl-6">
                        Please take note that this is a beta version feature and is provided on an &quot;as is&quot; and
                        &quot;as available&quot; basis. Solana Explorer does not provide any warranties and will not be
                        liable for any loss, direct or indirect, through continued use of this feature.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" size="sm" onClick={onCancel}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button variant="destructive" size="sm" onClick={onConfirm}>
                        <Send size={12} />
                        Yes, spend real funds
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

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
                        You&apos;re connected to Mainnet. Any SOL you send now is permanent and costs real money. Make
                        sure the details are correct before continuing.
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

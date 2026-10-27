import { Button } from '@components/shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@components/shared/ui/dialog';
import { AlertCircle, Send } from 'react-feather';

type MainnetWarningDialogProps = {
    isCustomIdl: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    onCancel: () => void;
};

// FIXME: missing Storybook story — pure-prop dialog, easy to story (open/closed variants + fn callbacks).
export function MainnetWarningDialog({
    isCustomIdl,
    open,
    onOpenChange,
    onConfirm,
    onCancel,
}: MainnetWarningDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="text-destructive" size={16} />
                        Spend real funds?
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-2 pl-6">
                    <DialogDescription>
                        You&apos;re connected to Mainnet. Any SOL you send now is permanent and costs real money. Make
                        sure the details are correct before continuing.
                    </DialogDescription>
                    {isCustomIdl && (
                        <p className="text-sm text-amber-300">
                            This transaction uses your custom IDL, not the IDL on chain. Make sure the custom IDL
                            matches the program.
                        </p>
                    )}
                    <p className="text-sm text-neutral-400">
                        Please take note that this is a beta version feature and is provided on an &quot;as is&quot; and
                        &quot;as available&quot; basis. Solana Explorer does not provide any warranties and will not be
                        liable for any loss, direct or indirect, through continued use of this feature.
                    </p>
                </div>
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

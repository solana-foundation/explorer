import type { InstructionAccountData } from '@entities/idl';
import { Badge } from '@shared/ui/badge';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { forwardRef, useId } from 'react';

export interface AccountInputProps extends React.ComponentProps<'input'> {
    account: InstructionAccountData;
    error: { message?: string | undefined } | undefined;
}

export const AccountInput = forwardRef<HTMLInputElement, AccountInputProps>(({ account, error, ...props }, ref) => {
    const inputId = useId();

    return (
        <div className="e-space-y-2">
            <div className="e-flex e-items-center e-gap-2">
                <Label className="e-text-sm e-font-normal e-text-neutral-200" htmlFor={inputId}>
                    {account.name}
                </Label>
                <div className="e-flex e-gap-1">
                    {account.writable && (
                        <Badge variant="warning" size="xs">
                            Mutable
                        </Badge>
                    )}
                    {account.signer && (
                        <Badge variant="warning" size="xs">
                            Signer
                        </Badge>
                    )}
                    {account.pda && (
                        <Badge variant="info" size="xs">
                            PDA
                        </Badge>
                    )}
                    {account.optional && (
                        <Badge variant="secondary" size="xs">
                            Optional
                        </Badge>
                    )}
                </div>
            </div>
            <Input ref={ref} {...props} id={inputId} variant="dark" aria-invalid={Boolean(error)} />
            {account.docs.length > 0 && <p className="e-text-xs e-text-neutral-400">{account.docs.join(' ')}</p>}
            {error && <p className="e-mt-1 e-text-xs e-text-destructive">{error.message}</p>}
        </div>
    );
});

AccountInput.displayName = 'AccountInput';

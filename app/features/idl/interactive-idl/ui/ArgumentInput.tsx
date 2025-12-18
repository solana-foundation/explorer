import type { ArgField } from '@entities/idl';
import { Badge } from '@shared/ui/badge';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { forwardRef, useId } from 'react';

import { isRequiredArg } from '../lib/instruction-args';

export interface ArgumentInputProps extends React.ComponentProps<'input'> {
    arg: ArgField;
    error: { message?: string | undefined } | undefined;
}

export const ArgumentInput = forwardRef<HTMLInputElement, ArgumentInputProps>(({ arg, error, ...props }, ref) => {
    const inputId = useId();
    return (
        <div className="e-space-y-2">
            <div className="e-flex e-items-center e-gap-2">
                <Label className="e-text-sm e-font-normal e-text-neutral-200" htmlFor={inputId}>
                    {arg.name}
                </Label>
                <Badge variant="info" size="xs">
                    {arg.type}
                </Badge>
                {!isRequiredArg(arg) && (
                    <Badge variant="secondary" size="xs">
                        Optional
                    </Badge>
                )}
            </div>
            <Input ref={ref} id={inputId} variant="dark" {...props} aria-invalid={Boolean(error)} />
            {arg.docs.length > 0 && <p className="e-text-xs e-text-neutral-400">{arg.docs.join(' ')}</p>}
            {error && <p className="e-mt-1 e-text-xs e-text-destructive">{error.message}</p>}
        </div>
    );
});

ArgumentInput.displayName = 'ArgumentInput';

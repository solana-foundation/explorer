import type { InstructionAccountData } from '@entities/idl';
import { Autocomplete } from '@shared/ui/autocomplete';
import { Badge } from '@shared/ui/badge';
import { Label } from '@shared/ui/label';
import { forwardRef, useState } from 'react';

import type { AutocompleteItem } from '../model/account-autocomplete/types';

export interface AccountInputProps extends React.ComponentProps<'input'> {
    account: InstructionAccountData;
    error: { message?: string | undefined } | undefined;
    autocompleteItems?: AutocompleteItem[];
}

export const AccountInput = forwardRef<
    HTMLInputElement,
    Omit<AccountInputProps, 'onChange'> & {
        // This type serves as an intermediary between the autocomplete component and the react-hook-form component
        onChange: (value: { target: { value: string }; currentTarget: { value: string } }) => void;
    }
>(({ account, error, onChange, autocompleteItems = [], ...props }, ref) => {
    const [inputId, setInputId] = useState('');

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
            <Autocomplete
                items={autocompleteItems}
                value={String(props.value)}
                onChange={value => {
                    onChange({
                        currentTarget: { value },
                        target: { value },
                    });
                }}
                inputProps={{
                    'aria-invalid': Boolean(error),
                    ref,
                    variant: 'dark',
                }}
                onInputIdReady={setInputId}
            />
            {account.docs.length > 0 && <p className="e-text-xs e-text-neutral-400">{account.docs.join(' ')}</p>}
            {error && <p className="e-mt-1 e-text-xs e-text-destructive">{error.message}</p>}
        </div>
    );
});

AccountInput.displayName = 'AccountInput';

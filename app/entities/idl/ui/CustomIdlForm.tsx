'use client';

import { Input, inputVariants } from '@components/shared/ui/input';
import { Label } from '@components/shared/ui/label';
import { cnPrefixed } from '@components/shared/utils';
import { useSetAtom } from 'jotai';
import { type ReactNode, useId, useRef, useState } from 'react';

import { type CustomIdlUploadError, uploadCustomIdlAtom } from '../model/custom-idl/custom-idl-store';
import { type CustomIdlOrigin } from '../model/custom-idl/types';
import { CUSTOM_IDL_SAVE_FAILED_MESSAGE, CUSTOM_IDL_STORAGE_UNAVAILABLE_MESSAGE } from './custom-idl-messages';

// The form renders no buttons, so a caller can place the submit button outside it through the `form` attribute.
export function CustomIdlForm({
    id,
    programAddress,
    initialText = '',
    initialOrigin = { kind: 'pasted' },
    onSaved,
    onSavingChange,
    children,
}: {
    id: string;
    programAddress: string | undefined;
    initialText?: string;
    initialOrigin?: CustomIdlOrigin;
    onSaved: (programAddress: string) => void;
    onSavingChange?: (isSaving: boolean) => void;
    children?: ReactNode;
}) {
    const uploadCustomIdl = useSetAtom(uploadCustomIdlAtom);
    const [text, setText] = useState(initialText);
    const [origin, setOrigin] = useState(initialOrigin);
    const [error, setError] = useState<string>();
    const [isSaving, setIsSaving] = useState(false);
    const fileInputId = useId();
    const textInputId = useId();
    const latestFile = useRef<File | undefined>(undefined);

    const handleFile = async (file: File | undefined) => {
        if (!file) return;
        latestFile.current = file;
        let fileText: string;
        try {
            fileText = await file.text();
        } catch {
            if (latestFile.current === file) setError('The browser could not read this file.');
            return;
        }
        if (latestFile.current !== file) return;
        setText(fileText);
        setOrigin({ fileName: file.name, kind: 'file' });
        setError(undefined);
    };

    const submit = async () => {
        if (isSaving) return;
        setIsSaving(true);
        onSavingChange?.(true);
        const result = await uploadCustomIdl({ origin, programAddress, text }).catch(() => undefined);
        setIsSaving(false);
        onSavingChange?.(false);
        if (!result) setError(CUSTOM_IDL_SAVE_FAILED_MESSAGE);
        else if (result.ok) onSaved(result.programAddress);
        else setError(describeUploadError(result.error));
    };

    return (
        <form
            id={id}
            className="flex flex-col gap-4"
            onSubmit={event => {
                event.preventDefault();
                void submit();
            }}
        >
            {children}
            <div className="flex flex-col gap-2">
                <Label htmlFor={fileInputId}>Anchor or Codama IDL file</Label>
                <Input
                    id={fileInputId}
                    type="file"
                    accept="application/json,.json"
                    variant="dark"
                    onChange={event => void handleFile(event.target.files?.[0])}
                />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor={textInputId}>Or paste the IDL JSON</Label>
                <textarea
                    id={textInputId}
                    className={cnPrefixed(inputVariants({ variant: 'dark' }), 'h-48 resize-y')}
                    required
                    value={text}
                    aria-invalid={error !== undefined}
                    onChange={event => {
                        latestFile.current = undefined;
                        setText(event.target.value);
                        setOrigin({ kind: 'pasted' });
                        setError(undefined);
                    }}
                />
                {error && (
                    <p role="alert" className="m-0 break-words text-xs text-destructive">
                        {error}
                    </p>
                )}
            </div>
        </form>
    );
}

function describeUploadError(error: CustomIdlUploadError): string {
    switch (error.kind) {
        case 'invalid-address':
            return 'The program address is not a valid Solana address.';
        case 'invalid-declared-address':
            return 'The program address that this IDL declares is not a valid Solana address.';
        case 'not-json':
            return 'This text is not valid JSON.';
        case 'not-an-idl':
            return 'This JSON is not an Anchor or Codama IDL.';
        case 'missing-address':
            return 'This IDL does not declare its program. Enter the program address.';
        case 'program-mismatch':
            return `This IDL is for program ${error.declaredAddress}, not ${error.programAddress}.`;
        case 'cannot-load':
            return 'The Explorer cannot decode instructions with this IDL.';
        case 'check-failed':
            return 'The Explorer could not check this IDL. Try again.';
        case 'quota-exceeded':
            return 'This IDL does not fit in the browser storage. Remove another custom IDL and try again.';
        case 'unavailable':
            return CUSTOM_IDL_STORAGE_UNAVAILABLE_MESSAGE;
    }
}

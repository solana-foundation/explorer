'use client';

import { inputVariants } from '@components/shared/ui/input';
import { Label } from '@components/shared/ui/label';
import { cn, cnPrefixed } from '@components/shared/utils';
import { useSetAtom } from 'jotai';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { FileText, Upload, X } from 'react-feather';

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
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    const removeFile = () => {
        latestFile.current = undefined;
        setText('');
        setOrigin({ kind: 'pasted' });
        setError(undefined);
        // A file input fires no change event for the file it already holds.
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const isDraggingFile = useWindowFileDrop(file => void handleFile(file));

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
            {isDraggingFile && <DropHint />}
            {children}
            <div className="flex flex-col gap-2">
                <Label htmlFor={fileInputId}>Anchor or Codama IDL file</Label>
                <input
                    ref={fileInputRef}
                    id={fileInputId}
                    type="file"
                    accept="application/json,.json"
                    className="sr-only"
                    tabIndex={-1}
                    onChange={event => void handleFile(event.target.files?.[0])}
                />
                {origin.kind === 'file' ? (
                    <ChosenFile fileName={origin.fileName} onRemove={removeFile} />
                ) : (
                    <ChooseFileButton onClick={() => fileInputRef.current?.click()} />
                )}
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor={textInputId}>Or paste the IDL JSON</Label>
                <textarea
                    id={textInputId}
                    className={cnPrefixed(
                        inputVariants({ variant: 'dark' }),
                        'h-48 resize-y border-outer-space-800 font-mono',
                    )}
                    required
                    spellCheck={false}
                    placeholder='{ "address": "…", "instructions": [ … ] }'
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

// Covers the nearest positioned ancestor, so the host decides what the hint frames.
function DropHint() {
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-dark-accent bg-dark-background/90 text-dark-accent"
        >
            <Upload size={24} />
            <span className="text-sm font-medium">Drop the IDL file</span>
        </div>
    );
}

function ChosenFile({ fileName, onRemove }: { fileName: string; onRemove: () => void }) {
    return (
        <div
            className={cn(FILE_BOX, 'flex min-w-0 items-center gap-2 border-solid border-outer-space-800 pl-3 pr-1.5')}
        >
            <FileText size={14} className="shrink-0 text-outer-space-300" />
            <span className="min-w-0 flex-1 break-all py-2 text-xs text-white">{fileName}</span>
            <button
                type="button"
                aria-label="Remove file"
                onClick={onRemove}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded border-0 bg-transparent p-0 text-outer-space-300 hover:text-white"
            >
                <X size={14} />
            </button>
        </div>
    );
}

function ChooseFileButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                FILE_BOX,
                'flex w-full items-center justify-center border-dashed border-outer-space-700 bg-transparent px-4 text-outer-space-300 transition-colors hover:border-outer-space-500 hover:text-white',
            )}
        >
            <span className="text-xs">
                <span className="text-white">Choose a file</span>
                {/* Phones and touch screens cannot drag a file. */}
                <span className="max-md:hidden [@media(pointer:coarse)]:hidden"> or drag it anywhere</span>
            </span>
        </button>
    );
}

const FILE_BOX = 'min-h-14 rounded border';

/**
 * Sends a file dropped anywhere in the window to `onFile`, and returns whether a file is dragged over the window.
 * A drop outside a small target would make the browser open the file in place of the page.
 */
function useWindowFileDrop(onFile: (file: File | undefined) => void): boolean {
    const [isDragging, setIsDragging] = useState(false);
    const onFileRef = useRef(onFile);
    onFileRef.current = onFile;

    useEffect(() => {
        // Every element that a drag crosses fires dragenter and dragleave, so a count of zero means the drag left.
        let depth = 0;
        const carriesFiles = (event: DragEvent) => Boolean(event.dataTransfer?.types.includes('Files'));
        const onDragEnter = (event: DragEvent) => {
            if (!carriesFiles(event)) return;
            depth += 1;
            setIsDragging(true);
        };
        const onDragLeave = (event: DragEvent) => {
            if (!carriesFiles(event)) return;
            depth = Math.max(0, depth - 1);
            if (depth === 0) setIsDragging(false);
        };
        const onDragOver = (event: DragEvent) => {
            if (!carriesFiles(event)) return;
            // Without preventDefault, the browser refuses the drop and opens the file on release.
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
        };
        const onDrop = (event: DragEvent) => {
            if (!carriesFiles(event)) return;
            event.preventDefault();
            depth = 0;
            setIsDragging(false);
            onFileRef.current(event.dataTransfer?.files[0]);
        };
        window.addEventListener('dragenter', onDragEnter);
        window.addEventListener('dragleave', onDragLeave);
        window.addEventListener('dragover', onDragOver);
        window.addEventListener('drop', onDrop);
        return () => {
            window.removeEventListener('dragenter', onDragEnter);
            window.removeEventListener('dragleave', onDragLeave);
            window.removeEventListener('dragover', onDragOver);
            window.removeEventListener('drop', onDrop);
        };
    }, []);

    return isDragging;
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

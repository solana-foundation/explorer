'use client';

/**
 * Dialog for editing wallet address nicknames.
 * Nicknames are stored in browser localStorage.
 */

import * as DialogPrimitive from '@radix-ui/react-dialog';
import React, { useEffect, useRef, useState } from 'react';

import { Button } from '@/app/components/shared/ui/button';
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from '@/app/components/shared/ui/dialog';
import { cn } from '@/app/components/shared/utils';
import { FormControl } from '@/app/shared/ui/FormControl';

import { getNickname, MAX_NICKNAME_LENGTH, removeNickname, setNickname } from '../lib/nicknames';

type Props = {
    address: string;
    open: boolean;
    onClose: () => void;
};

export function NicknameEditor({ address, open, onClose }: Props) {
    const [nickname, setNicknameLocal] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset to current saved value each time the dialog opens
    useEffect(() => {
        if (open) {
            setNicknameLocal(getNickname(address) ?? '');
        }
    }, [address, open]);

    const handleSave = () => {
        setNickname(address, nickname);
        onClose();
    };

    const handleRemove = () => {
        removeNickname(address);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (!nickname.trim()) return;
            handleSave();
        }
    };

    return (
        <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
            <DialogPortal>
                <DialogOverlay />
                <DialogPrimitive.Content
                    className={cn(
                        'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[500px] -translate-x-1/2 -translate-y-1/2',
                        'rounded-lg border border-transparent bg-neutral-800 p-4 shadow-lg',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out',
                        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                    )}
                    onOpenAutoFocus={e => {
                        // Prevent Radix's default scrollIntoView focus, use preventScroll instead
                        e.preventDefault();
                        inputRef.current?.focus({ preventScroll: true });
                    }}
                >
                    <DialogTitle className="m-0 mb-4 text-base font-medium text-white">Edit Nickname</DialogTitle>

                    <div className="mb-3">
                        <label className="mb-2 inline-block text-sm text-dk-gray-700">Address</label>
                        <div className="truncate font-mono text-sm">{address}</div>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="nickname-input" className="mb-2 inline-block">
                            Nickname
                        </label>
                        <FormControl>
                            <input
                                id="nickname-input"
                                ref={inputRef}
                                type="text"
                                value={nickname}
                                onChange={e => setNicknameLocal(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter a memorable name..."
                                maxLength={MAX_NICKNAME_LENGTH}
                                autoFocus
                            />
                        </FormControl>
                        <div className="flex justify-between">
                            <small className="text-dk-gray-700">This nickname is stored locally on your device.</small>
                            <small className="text-dk-gray-700">
                                {nickname.length}/{MAX_NICKNAME_LENGTH}
                            </small>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <div>
                            {getNickname(address) && (
                                <Button ui="dashkit" variant="outline-danger" size="sm" onClick={handleRemove}>
                                    Remove
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-1.5">
                            <Button ui="dashkit" variant="secondary" size="sm" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                ui="dashkit"
                                variant="primary"
                                size="sm"
                                onClick={handleSave}
                                disabled={!nickname.trim()}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    );
}

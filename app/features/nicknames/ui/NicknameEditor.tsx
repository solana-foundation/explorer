'use client';

/**
 * Simple modal for editing wallet address nicknames.
 * Nicknames are stored in browser localStorage.
 */

import React, { useEffect, useRef, useState } from 'react';

import { Button } from '@/app/components/shared/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { FormControl } from '@/app/shared/ui/FormControl';

import { getNickname, MAX_NICKNAME_LENGTH, removeNickname, setNickname } from '../lib/nicknames';

type Props = {
    address: string;
    onClose: () => void;
};

export function NicknameEditor({ address, onClose }: Props) {
    const [nickname, setNicknameLocal] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const saveButtonRef = useRef<HTMLButtonElement>(null);

    // Load existing nickname on mount
    useEffect(() => {
        const existing = getNickname(address);
        if (existing) {
            setNicknameLocal(existing);
        }
    }, [address]);

    const handleSave = () => {
        setNickname(address, nickname);
        onClose();
    };

    const handleRemove = () => {
        removeNickname(address);
        onClose();
    };

    // Support Enter to save, Escape to cancel
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    // Handle Tab key to cycle between input and save button
    const handleSaveButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            inputRef.current?.focus();
        }
    };

    return (
        <div
            className="e-fixed e-left-0 e-top-0 e-flex e-h-full e-w-full e-items-center e-justify-center"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 9999,
            }}
            onClick={onClose}
        >
            <Card
                ui="dashkit"
                className="e-shadow-lg"
                style={{ maxWidth: '500px', minWidth: '400px' }}
                onClick={e => e.stopPropagation()}
            >
                <CardHeader ui="dashkit">
                    <CardTitle as="h5" ui="dashkit">
                        Edit Nickname
                    </CardTitle>
                </CardHeader>
                <CardBody ui="dashkit">
                    <div className="e-mb-3">
                        <label className="e-mb-2 e-inline-block e-text-sm e-text-dk-gray-700">Address</label>
                        <div className="e-truncate e-font-mono e-text-sm">{address}</div>
                    </div>
                    <div className="e-mb-3">
                        <label htmlFor="nickname-input" className="e-mb-2 e-inline-block">
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
                        <div className="e-flex e-justify-between">
                            <small className="e-text-dk-gray-700">
                                This nickname is stored locally on your device.
                            </small>
                            <small className="e-text-dk-gray-700">
                                {nickname.length}/{MAX_NICKNAME_LENGTH}
                            </small>
                        </div>
                    </div>
                    <div className="e-flex e-justify-between">
                        <div>
                            {getNickname(address) && (
                                <Button ui="dashkit" variant="outline-danger" size="sm" onClick={handleRemove}>
                                    Remove
                                </Button>
                            )}
                        </div>
                        <div className="e-flex e-gap-1.5">
                            <Button ui="dashkit" variant="secondary" size="sm" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                ref={saveButtonRef}
                                ui="dashkit"
                                variant="primary"
                                size="sm"
                                onClick={handleSave}
                                onKeyDown={handleSaveButtonKeyDown}
                                disabled={!nickname.trim()}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}

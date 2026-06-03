'use client';

/**
 * Simple modal for editing wallet address nicknames.
 * Nicknames are stored in browser localStorage.
 */

import React, { useEffect, useRef, useState } from 'react';

import { CardBody, CardHeader } from '@/app/shared/ui/Card';

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
            className="top-0 start-0 e-fixed e-flex e-h-full e-w-full e-items-center e-justify-center"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 9999,
            }}
            onClick={onClose}
        >
            <div
                className="card shadow-lg"
                style={{ maxWidth: '500px', minWidth: '400px' }}
                onClick={e => e.stopPropagation()}
            >
                <CardHeader ui="dashkit">
                    <h5 className="card-header-title e-mb-0">Edit Nickname</h5>
                </CardHeader>
                <CardBody ui="dashkit">
                    <div className="e-mb-3">
                        <label className="form-label small text-muted">Address</label>
                        <div className="font-monospace small e-truncate">{address}</div>
                    </div>
                    <div className="e-mb-3">
                        <label htmlFor="nickname-input" className="form-label">
                            Nickname
                        </label>
                        <input
                            id="nickname-input"
                            ref={inputRef}
                            type="text"
                            className="form-control"
                            value={nickname}
                            onChange={e => setNicknameLocal(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter a memorable name..."
                            maxLength={MAX_NICKNAME_LENGTH}
                            autoFocus
                        />
                        <div className="e-flex e-justify-between">
                            <small className="text-muted">This nickname is stored locally on your device.</small>
                            <small className="text-muted">
                                {nickname.length}/{MAX_NICKNAME_LENGTH}
                            </small>
                        </div>
                    </div>
                    <div className="e-flex e-justify-between">
                        <div>
                            {getNickname(address) && (
                                <button className="btn btn-sm btn-outline-danger" onClick={handleRemove}>
                                    Remove
                                </button>
                            )}
                        </div>
                        <div className="e-flex e-gap-1.5">
                            <button className="btn btn-sm btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                ref={saveButtonRef}
                                className="btn btn-sm btn-primary"
                                onClick={handleSave}
                                onKeyDown={handleSaveButtonKeyDown}
                                disabled={!nickname.trim()}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </CardBody>
            </div>
        </div>
    );
}

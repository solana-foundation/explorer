'use client';

/**
 * Simple modal for editing wallet address nicknames.
 * Nicknames are stored in browser localStorage.
 */

import React, { useState, useEffect } from 'react';
import { getNickname, setNickname, removeNickname } from '@utils/nicknames';

type Props = {
    address: string;
    onClose: () => void;
};

export function NicknameEditor({ address, onClose }: Props) {
    const [nickname, setNicknameLocal] = useState('');

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

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 9999,
            }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded p-4 shadow"
                style={{ minWidth: '400px', maxWidth: '500px' }}
                onClick={e => e.stopPropagation()}
            >
                <h5 className="mb-3 text-dark">Edit Nickname</h5>
                <div className="mb-3">
                    <label className="form-label small text-muted">Address</label>
                    <div className="font-monospace small text-truncate text-dark">{address}</div>
                </div>
                <div className="mb-3">
                    <label htmlFor="nickname-input" className="form-label text-dark">
                        Nickname
                    </label>
                    <input
                        id="nickname-input"
                        type="text"
                        className="form-control"
                        style={{
                            fontSize: '1.1rem',
                            color: '#000',
                            backgroundColor: '#fff',
                        }}
                        value={nickname}
                        onChange={e => setNicknameLocal(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter a memorable name..."
                        autoFocus
                    />
                    <small className="text-muted">This nickname is stored locally on your device.</small>
                </div>
                <div className="d-flex justify-content-between">
                    <div>
                        {getNickname(address) && (
                            <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={handleRemove}
                            >
                                Remove
                            </button>
                        )}
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={handleSave}
                            disabled={!nickname.trim()}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

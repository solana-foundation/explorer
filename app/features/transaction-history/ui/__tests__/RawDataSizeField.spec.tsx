import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RawDataSizeField } from '../RawDataSizeField';

describe('RawDataSizeField', () => {
    it('should show the message size in bytes for a loaded row', () => {
        const messageBytes = new Uint8Array(1234);
        render(<RawDataSizeField filename="sig" state={{ messageBytes, status: 'loaded', summaries: [] }} />);

        expect(screen.getByRole('button', { name: '1,234' })).toBeInTheDocument();
    });

    it('should call retry when the failed fetch is retried', () => {
        const retry = vi.fn();
        render(<RawDataSizeField filename="sig" state={{ retry, status: 'failed' }} />);

        fireEvent.click(screen.getByRole('button', { name: 'Retry loading size' }));

        expect(retry).toHaveBeenCalledOnce();
    });

    it('should show no button while loading', () => {
        render(<RawDataSizeField filename="sig" state={{ status: 'loading' }} />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});

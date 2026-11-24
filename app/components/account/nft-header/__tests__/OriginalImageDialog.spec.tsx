import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { OriginalImageDialog } from '../OriginalImageDialog';

const URI = 'https://arweave.net/abc/image.png';

function renderDialog() {
    render(
        <OriginalImageDialog uri={URI}>
            <button type="button">View original</button>
        </OriginalImageDialog>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'View original' }));
}

describe('OriginalImageDialog', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should name the server before anything opens', () => {
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);
        renderDialog();

        expect(screen.getByText('Open the original image?')).toBeInTheDocument();
        expect(screen.getByText('arweave.net')).toBeInTheDocument();
        expect(screen.getByText(URI)).toBeInTheDocument();
        expect(open).not.toHaveBeenCalled();
    });

    it('should open the image in a new tab on Open', () => {
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);
        renderDialog();

        fireEvent.click(screen.getByRole('button', { name: 'Open' }));

        expect(open).toHaveBeenCalledWith(URI, '_blank', 'noopener,noreferrer');
    });

    it('should close without opening anything on Cancel', async () => {
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);
        renderDialog();

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        await waitFor(() => expect(screen.queryByText('Open the original image?')).not.toBeInTheDocument());
        expect(open).not.toHaveBeenCalled();
    });
});

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '../route';

vi.mock('next/og', () => ({
    ImageResponse: vi.fn(() => {
        return new Response('mock-image-response', {
            headers: {
                'Content-Type': 'image/png',
            },
            status: 200,
        });
    }),
}));

vi.mock('@features/receipt', () => ({
    BaseReceiptImage: vi.fn(() => null),
    OG_IMAGE_SIZE: { height: 630, width: 1200 },
    createReceipt: vi.fn(),
    getCachedReceipt: vi.fn(),
    getReceiptImageUrl: vi.fn().mockResolvedValue(undefined),
    isReceiptEnabled: true,
    storeReceiptImage: vi.fn().mockResolvedValue(undefined),
}));

describe('GET /og/receipt/[signature]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should generate image successfully with signature', async () => {
        const { createReceipt } = await import('@features/receipt');
        const url = new URL('http://localhost:3000/og/receipt/test-signature-123');
        const request = new NextRequest(url.toString());

        const response = await GET(request, { params: { signature: 'test-signature-123' } });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('image/png');
        expect(createReceipt).toHaveBeenCalledWith('test-signature-123');
    });

    it('should return 404 when transaction or cluster not found', async () => {
        const { createReceipt } = await import('@features/receipt');
        vi.mocked(createReceipt).mockRejectedValue(new Error('Transaction not found'));

        const url = new URL('http://localhost:3000/og/receipt/test-signature-123');
        const request = new NextRequest(url.toString());

        const response = await GET(request, { params: { signature: 'test-signature-123' } });

        expect(response.status).toBe(404);
        const text = await response.text();
        expect(text).toBe('Receipt not found');
    });

    it('should return 502 when fetch transaction fails', async () => {
        const { createReceipt } = await import('@features/receipt');
        vi.mocked(createReceipt).mockRejectedValue(new Error('Failed to fetch transaction'));

        const request = new NextRequest('http://localhost:3000/og/receipt/abc');

        const response = await GET(request, { params: { signature: 'abc' } });

        expect(response.status).toBe(502);
        const text = await response.text();
        expect(text).toBe('Failed to process request');
    });

    it('should return 500 for unknown errors', async () => {
        const { createReceipt } = await import('@features/receipt');
        vi.mocked(createReceipt).mockRejectedValue(new Error('Something broke'));

        const request = new NextRequest('http://localhost:3000/og/receipt/abc');

        const response = await GET(request, { params: { signature: 'abc' } });

        expect(response.status).toBe(500);
        const text = await response.text();
        expect(text).toBe('Failed to process request');
    });
});

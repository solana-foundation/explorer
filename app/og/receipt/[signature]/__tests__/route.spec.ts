import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('@features/receipt', async importOriginal => {
    const actual = await importOriginal<typeof import('@features/receipt')>();
    return {
        ...actual,
        BaseReceiptImage: vi.fn(() => null),
        OG_IMAGE_SIZE: { height: 630, width: 1200 },
        createReceipt: vi.fn(),
        getCachedReceipt: vi.fn(),
        getReceiptImageUrl: vi.fn().mockResolvedValue(undefined),
        isReceiptEnabled: true,
        get ogImageVersion() {
            return process.env.RECEIPT_OG_IMAGE_VERSION?.trim() ?? '';
        },
        storeReceiptImage: vi.fn().mockResolvedValue(undefined),
    };
});

const validSignature = '5yKzCuw1e9d58HcnzSL31cczfXUux2H4Ga5TAR2RcQLE5W8BiTAC9x9MvhLtc4h99sC9XxLEAjhrXyfKezdMkZFV';

describe('GET /og/receipt/[signature]', () => {
    beforeEach(async () => {
        await vi.stubEnv('RECEIPT_OG_IMAGE_VERSION', '');
        vi.resetModules();
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should generate image successfully with signature', async () => {
        const { GET } = await import('../route');
        const { createReceipt } = await import('@features/receipt');
        const url = new URL(`http://localhost:3000/og/receipt/${validSignature}`);
        const request = new NextRequest(url.toString());

        const response = await GET(request, { params: { signature: validSignature } });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('image/png');
        expect(createReceipt).toHaveBeenCalledWith(validSignature, undefined);
    });

    it('should return 400 when signature is invalid and not call createReceipt', async () => {
        const { GET } = await import('../route');
        const { createReceipt } = await import('@features/receipt');
        const request = new NextRequest('http://localhost:3000/og/receipt/not-base58!!!');

        const response = await GET(request, { params: { signature: 'not-base58!!!' } });

        expect(response.status).toBe(400);
        expect(await response.text()).toBe('Invalid transaction signature');
        expect(createReceipt).not.toHaveBeenCalled();
    });

    it('should return 404 when transaction or cluster not found', async () => {
        const { GET } = await import('../route');
        const { createReceipt, ReceiptError } = await import('@features/receipt');
        vi.mocked(createReceipt).mockRejectedValue(new ReceiptError('Transaction not found', { status: 404 }));

        const url = new URL(`http://localhost:3000/og/receipt/${validSignature}`);
        const request = new NextRequest(url.toString());

        const response = await GET(request, { params: { signature: validSignature } });

        expect(response.status).toBe(404);
        const text = await response.text();
        expect(text).toBe('Receipt not found');
    });

    it('should return 502 when fetch transaction fails', async () => {
        const { GET } = await import('../route');
        const { createReceipt, ReceiptError } = await import('@features/receipt');
        vi.mocked(createReceipt).mockRejectedValue(new ReceiptError('Failed to fetch transaction', { status: 502 }));

        const request = new NextRequest(`http://localhost:3000/og/receipt/${validSignature}`);

        const response = await GET(request, { params: { signature: validSignature } });

        expect(response.status).toBe(502);
        const text = await response.text();
        expect(text).toBe('Failed to process request');
    });

    it('should return 500 for unknown errors', async () => {
        const { GET } = await import('../route');
        const { createReceipt } = await import('@features/receipt');
        vi.mocked(createReceipt).mockRejectedValue(new Error('Something broke'));

        const request = new NextRequest(`http://localhost:3000/og/receipt/${validSignature}`);

        const response = await GET(request, { params: { signature: validSignature } });

        expect(response.status).toBe(500);
        const text = await response.text();
        expect(text).toBe('Failed to process request');
    });
});

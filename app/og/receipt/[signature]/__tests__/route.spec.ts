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

vi.mock('@features/receipt', async (importOriginal) => {
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
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should generate image successfully with signature', async () => {
        const { createReceipt } = await import('@features/receipt');
        const url = new URL(`http://localhost:3000/og/receipt/${validSignature}`);
        const request = new NextRequest(url.toString());

        const response = await GET(request, { params: { signature: validSignature } });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('image/png');
        expect(createReceipt).toHaveBeenCalledWith(validSignature, undefined);
    });

    it('should return 400 when signature is invalid and not call createReceipt', async () => {
        const { createReceipt } = await import('@features/receipt');
        const request = new NextRequest('http://localhost:3000/og/receipt/not-base58!!!');

        const response = await GET(request, { params: { signature: 'not-base58!!!' } });

        expect(response.status).toBe(400);
        expect(await response.text()).toBe('Invalid transaction signature');
        expect(createReceipt).not.toHaveBeenCalled();
    });

    it('should return 404 when transaction or cluster not found', async () => {
        const { createReceipt } = await import('@features/receipt');
        vi.mocked(createReceipt).mockRejectedValue(new Error('Transaction not found'));

        const url = new URL(`http://localhost:3000/og/receipt/${validSignature}`);
        const request = new NextRequest(url.toString());

        const response = await GET(request, { params: { signature: validSignature } });

        expect(response.status).toBe(404);
        const text = await response.text();
        expect(text).toBe('Receipt not found');
    });

    it('should return 502 when fetch transaction fails', async () => {
        const { createReceipt } = await import('@features/receipt');
        vi.mocked(createReceipt).mockRejectedValue(new Error('Failed to fetch transaction'));

        const request = new NextRequest(`http://localhost:3000/og/receipt/${validSignature}`);

        const response = await GET(request, { params: { signature: validSignature } });

        expect(response.status).toBe(502);
        const text = await response.text();
        expect(text).toBe('Failed to process request');
    });

    it('should return 500 for unknown errors', async () => {
        const { createReceipt } = await import('@features/receipt');
        vi.mocked(createReceipt).mockRejectedValue(new Error('Something broke'));

        const request = new NextRequest(`http://localhost:3000/og/receipt/${validSignature}`);

        const response = await GET(request, { params: { signature: validSignature } });

        expect(response.status).toBe(500);
        const text = await response.text();
        expect(text).toBe('Failed to process request');
    });

    it('should use no version when v is omitted and ETag is signature only', async () => {
        const { createReceipt } = await import('@features/receipt');
        vi.mocked(createReceipt).mockResolvedValue(undefined as never);

        const url = new URL(`http://localhost:3000/og/receipt/${validSignature}`);
        const request = new NextRequest(url.toString());

        const response = await GET(request, { params: { signature: validSignature } });

        expect(response.status).toBe(200);
        expect(response.headers.get('ETag')).toBe(`"${validSignature}"`);
    });

    it('should include ogImageVersion in ETag when set', async () => {
        const { createReceipt } = await import('@features/receipt');
        vi.mocked(createReceipt).mockResolvedValue(undefined as never);

        await vi.stubEnv('RECEIPT_OG_IMAGE_VERSION', '2');
        const url = new URL(`http://localhost:3000/og/receipt/${validSignature}`);
        const request = new NextRequest(url.toString());

        const response = await GET(request, { params: { signature: validSignature } });

        expect(response.status).toBe(200);
        expect(response.headers.get('ETag')).toContain('2');
    });
});

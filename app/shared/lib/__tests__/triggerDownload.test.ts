import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { triggerDownload } from '../triggerDownload';

describe('triggerDownload', () => {
    let mockClick: ReturnType<typeof vi.fn>;
    let mockAppendChild: ReturnType<typeof vi.fn>;
    let mockRemoveChild: ReturnType<typeof vi.fn>;
    let mockCreateObjectURL: ReturnType<typeof vi.fn>;
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
    let mockBody: HTMLElement;
    let mockLink: HTMLAnchorElement;

    beforeEach(() => {
        mockClick = vi.fn();
        mockAppendChild = vi.fn();
        mockRemoveChild = vi.fn();
        mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
        mockRevokeObjectURL = vi.fn();

        mockLink = {
            click: mockClick,
            href: '',
            parentNode: null,
            setAttribute: vi.fn(),
            style: { display: '' },
        } as unknown as HTMLAnchorElement;

        mockBody = {
            appendChild: mockAppendChild,
            removeChild: mockRemoveChild,
        } as unknown as HTMLElement;

        vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
            if (tagName === 'a') {
                return mockLink;
            }
            return document.createElement(tagName);
        });

        Object.defineProperty(document, 'body', {
            value: mockBody,
            writable: true,
        });

        global.URL.createObjectURL = mockCreateObjectURL;
        global.URL.revokeObjectURL = mockRevokeObjectURL;

        global.Blob = vi.fn((parts, options) => {
            return {
                size: parts[0]?.length || 0,
                type: options?.type || '',
            };
        }) as unknown as typeof Blob;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('input validation', () => {
        it('should throw error if data is empty string', async () => {
            await expect(triggerDownload('', 'file.txt')).rejects.toThrow('Invalid data: must be a non-empty string');
        });

        it('should throw error if data is invalid base64', async () => {
            await expect(triggerDownload('Hello World!', 'file.txt')).rejects.toThrow(
                'Invalid data: not a valid base64 string'
            );
        });
    });

    describe('file size validation', () => {
        it('should reject files exceeding default max size (10MB)', async () => {
            // Create base64 string that decodes to ~11MB
            const largeBase64 = createBase64OfSize(11 * 1024 * 1024);
            await expect(triggerDownload(largeBase64, 'file.txt')).rejects.toThrow('exceeds maximum allowed size');
        });

        it('should accept files within default max size', async () => {
            // Create base64 string that decodes to ~5MB
            const mediumBase64 = createBase64OfSize(5 * 1024 * 1024);
            await expect(triggerDownload(mediumBase64, 'file.txt')).resolves.not.toThrow();
        });
    });

    describe('download functionality', () => {
        it('should create blob with correct data and type', async () => {
            const data = 'Hello World';
            const base64 = toBase64(data);
            const mimeType = 'text/plain';

            await triggerDownload(base64, 'file.txt', { type: mimeType });

            expect(global.Blob).toHaveBeenCalledWith([expect.any(Buffer)], { type: mimeType });
        });

        it('should create blob without type when not provided', async () => {
            const base64 = toBase64('Hello');
            await triggerDownload(base64, 'file.txt');

            expect(global.Blob).toHaveBeenCalledWith([expect.any(Buffer)], {});
        });

        it('should create object URL from blob', async () => {
            const base64 = toBase64('Hello');
            await triggerDownload(base64, 'file.txt');

            expect(mockCreateObjectURL).toHaveBeenCalled();
        });

        it('should create anchor element with download attribute', async () => {
            const base64 = toBase64('Hello');
            const filename = 'test-file.txt';

            await triggerDownload(base64, filename);

            expect(document.createElement).toHaveBeenCalledWith('a');
            expect(mockLink.setAttribute).toHaveBeenCalledWith('download', filename);
            expect(mockLink.href).toBe('blob:mock-url');
            expect(mockLink.style.display).toBe('none');
        });

        it('should append link to body and trigger click', async () => {
            const base64 = toBase64('Hello');
            await triggerDownload(base64, 'file.txt');

            expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
            expect(mockClick).toHaveBeenCalled();
        });

        it('should cleanup object URL and DOM element', async () => {
            const base64 = toBase64('Hello');
            Object.defineProperty(mockLink, 'parentNode', {
                configurable: true,
                value: mockBody,
                writable: true,
            });

            await triggerDownload(base64, 'file.txt');

            expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
            expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
        });

        it('should cleanup even if click fails', async () => {
            const base64 = toBase64('Hello');
            Object.defineProperty(mockLink, 'parentNode', {
                configurable: true,
                value: mockBody,
                writable: true,
            });
            mockClick.mockImplementation(() => {
                throw new Error('Click failed');
            });

            await expect(triggerDownload(base64, 'file.txt')).rejects.toThrow('Click failed');
            expect(mockRevokeObjectURL).toHaveBeenCalled();
            expect(mockRemoveChild).toHaveBeenCalled();
        });

        it('should cleanup even if link has no parent', async () => {
            const base64 = toBase64('Hello');
            Object.defineProperty(mockLink, 'parentNode', {
                configurable: true,
                value: null,
                writable: true,
            });

            await triggerDownload(base64, 'file.txt');

            expect(mockRevokeObjectURL).toHaveBeenCalled();
            expect(mockRemoveChild).not.toHaveBeenCalled();
        });
    });
});

const toBase64 = (str: string): string => {
    return Buffer.from(str).toString('base64');
};

const createBase64OfSize = (sizeInBytes: number): string => {
    const data = 'A'.repeat(sizeInBytes);
    return Buffer.from(data).toString('base64');
};

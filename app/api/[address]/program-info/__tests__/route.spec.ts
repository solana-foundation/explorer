import { afterEach, describe, expect, it, vi } from 'vitest';

let mockResultRows: any[] = [];

vi.mock('@/src/db/drizzle', () => {
    const chain: any = {
        _rows: () => mockResultRows,
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => Promise.resolve(chain._rows())),
    };
    return { db: chain };
});

// Mock error response helper
vi.mock('@/app/api/shared/errors', () => ({
    respondWithError: vi.fn((status: number) => new Response(JSON.stringify({ error: 'Test error' }), { status })),
}));

// Mock logger
vi.mock('@/app/utils/logger', () => ({
    default: {
        error: vi.fn(),
    },
}));

async function importRoute() {
    return await import('../route');
}

afterEach(() => {
    vi.clearAllMocks();
    mockResultRows = [];
});

describe('GET /api/[address]/program-info', () => {
    it('returns program info and sets cache-control header', async () => {
        mockResultRows = [{ calling_programs_count: 3, program_address: 'Prog1', transaction_references_count: 12 }];

        const { GET } = await importRoute();
        const request = new Request('http://localhost:3000/api/Prog1/program-info');

        const res = await GET(request, { params: { address: 'Prog1' } });
        expect(res.status).toBe(200);
        expect(res.headers.get('cache-control')).toBe('public, s-maxage=600, stale-while-revalidate=60');

        const data = await res.json();
        expect(data).toEqual(mockResultRows);
    });

    it('handles database errors gracefully', async () => {
        const { GET } = await importRoute();

        // Mock db chain to throw error
        const { db } = await import('@/src/db/drizzle');
        (db.select as any).mockImplementationOnce(() => {
            throw new Error('Database connection failed');
        });

        const request = new Request('http://localhost:3000/api/Prog1/program-info');
        const res = await GET(request, { params: { address: 'Prog1' } });

        expect(res.status).toBe(500);
    });

    it('logs errors when they occur', async () => {
        const { GET } = await importRoute();
        const Logger = (await import('@/app/utils/logger')).default;

        // Mock db chain to throw error
        const { db } = await import('@/src/db/drizzle');
        (db.select as any).mockImplementationOnce(() => {
            throw new Error('Database connection failed');
        });

        const request = new Request('http://localhost:3000/api/Prog1/program-info');
        await GET(request, { params: { address: 'Prog1' } });

        expect(Logger.error).toHaveBeenCalledWith(expect.any(Error));
    });
});

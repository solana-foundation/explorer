export interface PaginationParams {
    limit: number;
    offset: number;
}

export interface PaginationResult extends PaginationParams {
    total: number;
    totalPages: number;
}

export class PaginationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PaginationError';
    }
}

/**
 * Parses and validates pagination parameters from URL search params
 * @param searchParams - URLSearchParams from request
 * @returns Validated pagination parameters
 * @throws PaginationError if parameters are invalid
 */
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check for invalid values (NaN or negative numbers)
    if (isNaN(limit) || isNaN(offset) || limit < 0 || offset < 0 || limit > 100) {
        throw new PaginationError('Invalid pagination parameters');
    }

    return { limit, offset };
}

/**
 * Calculates pagination result with total pages
 * @param params - Pagination parameters (limit, offset)
 * @param total - Total number of records
 * @returns Complete pagination result including totalPages
 */
export function calculatePagination(params: PaginationParams, total: number): PaginationResult {
    return {
        ...params,
        total,
        totalPages: params.limit ? Math.ceil(total / params.limit) : 0,
    };
}

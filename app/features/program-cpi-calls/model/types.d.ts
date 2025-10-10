export interface ProgramCallData {
    address: string;
    calls_number: number;
    createdAt: string;
    description: string | 'None';
    name: string | 'None';
    program_address: string;
}

export interface PagesPaginationWrapper<T extends ProgramCallData> {
    data: Array<T>;
    pagination: { limit: number; offset: number; totalPages: number; total: number };
}

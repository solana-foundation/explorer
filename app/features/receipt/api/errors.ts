export type ReceiptErrorOptions = ErrorOptions & { status: number };

export class ReceiptError extends Error {
    readonly status: number;

    constructor(message?: string, options?: ReceiptErrorOptions) {
        super(message, options);
        this.name = 'ReceiptError';
        this.status = options?.status ?? 500;
    }
}

type HttpErrorDetails = {
    status: number;
    statusText: string;
};

export class TokenInfoHttpError extends Error {
    readonly status: number;
    readonly statusText: string;

    constructor({ status, statusText }: HttpErrorDetails, options?: ErrorOptions) {
        super(`HTTP ${status}: ${statusText}`, options);
        this.name = 'TokenInfoHttpError';
        this.status = status;
        this.statusText = statusText;
    }
}

export class TokenInfoInvalidResponseError extends Error {
    constructor(message: string = 'Invalid response: missing content', options?: ErrorOptions) {
        super(message, options);
        this.name = 'TokenInfoInvalidResponseError';
    }
}

export class UnsupportedTransactionVersionError extends Error {
    readonly version: unknown;

    constructor(version: unknown) {
        super(`Unsupported transaction version: ${String(version)}`);
        this.name = 'UnsupportedTransactionVersionError';
        this.version = version;
    }
}

export class MalformedTransactionError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'MalformedTransactionError';
    }
}

export class InvalidTransactionConfigError extends MalformedTransactionError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'InvalidTransactionConfigError';
    }
}

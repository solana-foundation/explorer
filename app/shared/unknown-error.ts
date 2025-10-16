export const UNKNOWN_ERROR = 'Unknown error' as const;

export const normalizeUnknownError = (error: unknown, customMessage?: string): Error => {
    if (error instanceof Error) {
        return error;
    } else if (typeof error === 'string') {
        return new Error(error);
    } else {
        return new Error(customMessage ?? UNKNOWN_ERROR, { cause: error });
    }
};

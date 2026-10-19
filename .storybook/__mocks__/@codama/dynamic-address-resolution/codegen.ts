// The browser build of `@codama/dynamic-client` calls these only in `generateClientTypes`, which no story uses.
const unavailable = () => {
    throw new Error('@codama/dynamic-address-resolution/codegen is not available in the browser');
};

export const generatePdaTypes = unavailable;
export const generateResolutionInputTypes = unavailable;
export const getResolutionRefs = unavailable;

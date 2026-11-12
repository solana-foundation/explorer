// Only `generateClientTypes` calls these, and no story uses it
const unavailable = () => {
    throw new Error('@codama/dynamic-address-resolution/codegen is not available in the browser');
};

export const generatePdaTypes = unavailable;
export const generateResolutionInputTypes = unavailable;
export const getResolutionRefs = unavailable;

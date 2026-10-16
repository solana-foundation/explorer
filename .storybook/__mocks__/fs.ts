// The Node-only codegen entry of `@codama/dynamic-*` imports these names. Nothing in the browser calls them.
const unavailable = () => {
    throw new Error('fs is not available in the browser');
};

export const existsSync = () => false;
export const readFileSync = unavailable;
export const mkdirSync = unavailable;
export const writeFileSync = unavailable;
const fs = { existsSync, mkdirSync, readFileSync, writeFileSync };
export default fs;

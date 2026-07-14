// Stub for Node built-ins aliased in next.config.mjs turbopack.resolveAlias.
// Named exports stub out fs functions imported by node-only packages (e.g. @codama/dynamic-address-resolution/codegen)
// that get pulled into the browser bundle. These functions are never called at runtime in the browser.
export const existsSync = () => false;
export const readFileSync = () => '';
export const mkdirSync = () => undefined;
export const writeFileSync = () => undefined;

const emptyModule = {};

export default emptyModule;

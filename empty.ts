// Empty module used to stub Node.js built-ins (e.g. `fs`) in client bundles via
// `turbopack.resolveAlias` in next.config.mjs. Code paths that import these built-ins
// are never executed on the client, so an empty default export is sufficient.
const emptyModule = {};

export default emptyModule;

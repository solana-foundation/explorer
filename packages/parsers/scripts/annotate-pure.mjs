// Marks module-scope enums() calls pure in dist so bundlers can tree-shake unused Structs (agadoo gate).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const target = fileURLToPath(new URL('../dist/program-registry.js', import.meta.url));
const source = readFileSync(target, 'utf8');
const annotated = source.replaceAll('= enums(', '= /*#__PURE__*/ enums(');
if (annotated === source) {
    throw new Error('annotate-pure: no enums() call sites found in dist/program-registry.js');
}
writeFileSync(target, annotated);

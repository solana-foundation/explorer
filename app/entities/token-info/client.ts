import 'client-only';

// Off `index.ts` so that barrel stays reachable from the server graph: the root layout imports
// `TokenInfoBatchProvider` through it, and a `client-only` hook re-exported alongside fails the build.
export { getTokenInfosSwrKey, useTokenInfos } from './model/use-token-infos';

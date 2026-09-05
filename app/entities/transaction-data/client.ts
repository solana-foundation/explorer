import 'client-only';

// Off `index.ts` so that barrel stays universal: `fetchTransactionDetails` is reached from the
// `/og/receipt` route handler, and a hook re-exported alongside it lands in the server graph.
export { useResolvedInstructionNames, useResolvedSummaryNames } from './model/use-resolved-instruction-names';

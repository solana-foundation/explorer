import 'server-only';

import { getTx } from '../api/get-tx';
import { type QueryCluster } from './cluster';
import { extractReceiptData, type ReceiptResult } from './receipt-data';

/**
 * Builds a receipt for a signature the caller has not fetched yet.
 *
 * Server-only because `getTx` probes for the cluster, which reads the non-public `*_RPC_URL` vars. The
 * shaping half is universal and lives in `receipt-data.ts`, so the client receipt page can import that
 * without dragging this probe into the browser bundle.
 * @param signature - The transaction signature to build a receipt for
 * @param cluster - The cluster to read from, or undefined to probe for it
 */
export async function createReceipt(signature: string, cluster?: QueryCluster): Promise<ReceiptResult> {
    const data = await getTx(signature, undefined, cluster);
    return extractReceiptData(data.transaction, data.cluster);
}

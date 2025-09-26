# Cron Route for QuickNode Streaming Data

## Overview

This Vercel Cron Job refresh materialized view inside Postgres to build suitable data structure from QuckNode Solana blocks data to unifies both data sources (Dune and QuckNode).

- **QuickNode Streams** → filters & streams Solana CPI calls directly into Postgres.
- **Dune** → provides historical data.
- **Materialized View** → `public.quicknode_stream_cpi_program_calls_mv` has CPI calls data with same structure that we have in Dune materialized view.
- **Cron Route** → periodically refreshes the MV with concurrency-safe SQL.

---

## Architecture

```
[SOLANA RPC/QuickNode]
        |
        |  (QuickNode Streams + Filter)
        v
[Postgres (raw stream tables)]
        |
        |  (build suitable data structure)
        v
[Materialized View: public.quicknode_stream_cpi_program_calls_mv]
        ^
        |
  (Refreshed by Vercel Cron route)
```

---

## Cron API Route

- **Purpose:** Refreshes the MV up to 7 times (initial + 6 repeats every 5s).
- **Return:** Immediately responds with:

```json
{ "ok": true }
```

while background refreshes continue.

### Security

The route requires a secret in the request header:

```
Authorization: Bearer <CRON_SECRET>
```

If missing/invalid → **401 Unauthorized**.

---

## Environment Variables

```bash
CRON_SECRET=your-strong-secret
DATABASE_URL=postgres://user:pass@host:5432/db
```

---

## Vercel Cron Job Setup

Setted up in `vercel.json`.
Manual trigger is possible via HTTP request.

---

## QuickNode CPI Filter

QuickNode filters inbound Solana blocks/transactions **before inserting into Postgres**.
It looks for **CPI calls** to specific callee programs and extracts relevant fields.

```js
const CALLEE_PROGRAMS = new Set([
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb', // Token-2022
  '22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG', // SAS
  'ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S'   // PM
]);

const PROGRAM_NAME_BY_ID = {
  '11111111111111111111111111111111': 'system',
  'ComputeBudget111111111111111111111111111111': 'compute-budget',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'spl-associated-token-account',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'spl-token',

  // Callee set
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb': 'Token2022',
  '22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG': 'Solana Attestation Serivce',
  'ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S': 'Program Metadata Program'
};

const nameForProgramId = (pid, fallback) =>
  PROGRAM_NAME_BY_ID[pid] || fallback || null;

const isValidTx = (tx) =>
  tx && tx.transaction && tx.meta &&
  Array.isArray(tx.transaction.signatures) &&
  Array.isArray(tx.transaction.message?.accountKeys);

function extractHitsFromTx(tx, parentSlot, blockTime) {
  const hits = [];
  const inner = tx.meta?.innerInstructions || [];

  for (const group of inner) {
    const parentIndex = group.index;
    const parentIx = tx.transaction?.message?.instructions?.[parentIndex];

    for (const ix of (group.instructions || [])) {
      if (!CALLEE_PROGRAMS.has(ix.programId)) continue;

      const callerProgramId = parentIx?.programId ?? null;
      const callerProgramName = nameForProgramId(callerProgramId, parentIx?.program);

      hits.push({
        caller_program_name: callerProgramName,
        caller_program_address: callerProgramId,
        program_address: ix.programId,
        block_slot: parentSlot ?? null
      });
    }
  }
  return hits;
}

function logsSuggestCPI(tx) {
  const logs = tx.meta?.logMessages || [];
  for (const callee of CALLEE_PROGRAMS) {
    const needle = `Program ${callee} invoke [`;
    for (const line of logs) {
      if (!line.includes(needle)) continue;
      const m = line.match(/invoke \[(\d+)\]/);
      if (m && Number(m[1]) >= 2) return callee; // CPI depth >= 2
    }
  }
  return null;
}

async function main(payload) {
  const { data, metadata } = payload;
  if (!Array.isArray(data)) return payload;

  try {
    const results = [];

    for (const block of data) {
      const parentSlot = block?.parentSlot ?? null;
      const blockTime = block?.blockTime ?? null;
      const txs = Array.isArray(block?.transactions) ? block.transactions : [];

      for (const tx of txs) {
        if (!isValidTx(tx)) continue;

        const hits = extractHitsFromTx(tx, parentSlot, blockTime);
        if (hits.length > 0) {
          results.push(...hits);
          continue;
        }

        // fallback via logs
        if (!tx.meta?.innerInstructions) {
          const callee = logsSuggestCPI(tx);
          if (callee) {
            results.push({
              program_address: callee,
              caller_program_name: null,
              caller_program_address: null,
              block_slot: parentSlot
            });
          }
        }
      }
    }

    return { data: results, metadata };
  } catch (e) {
    console.error('CPI filter error:', e);
    return payload; // fail-safe
  }
}
```

### Extracted fields

- `program_address`: matched callee program
- `caller_program_name` / `caller_program_address`: parent instruction context
- `block_slot`: slot of the block

**Output:** Inserted directly into Postgres via QuickNode’s Postgres sink.

---

## Materialized View

- **Name:** `public.quicknode_stream_cpi_program_calls_mv`
- **Purpose:** Build suitable data structure based on raw Solana blocks data.
- **Refresh Mode:** `CONCURRENTLY` → avoids blocking but may fail if already refreshing.

---

## Error Handling

- Unauthorized request → `401 Unauthorized`.
- Refresh error → logged via `Logger.error`.

---

## Notes

- **Intervals:** 7 refreshes total (1 immediate + 6 every 5s).
- **Safe to retry:** Concurrent refreshes won’t block readers.
- **Data pipeline:** QuickNode Streams → Postgres sink (filtered CPI calls) → MV → refreshed by cron.

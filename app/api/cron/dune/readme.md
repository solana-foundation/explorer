# Cron Routes: Dune Sync

This repo contains **two** Next.js API routes driven by **Vercel Cron Jobs** to sync Dune CPI calls historical data.
- **Real‑time Solana data** streamed from **QuickNode** *directly into Postgres*.
- **Historical & aggregate data** from **Dune** (via SDK).
- A **materialized view** that unifies both sources.

---

## Architecture

- **QuickNode → Postgres sink**: Streams filtered CPI rows **directly** into Postgres (no middle service).
- **Dune routes**: Import Program Usage and Historical CPI Calls on schedule, then the MV refresher rebuilds the unified view.

---

## Environment Variables

```bash
# Common
CRON_SECRET=your-strong-secret
DATABASE_URL=postgres://user:pass@host:5432/db

# Dune
DUNE_API_KEY=your-dune-api-key
DUNE_PROGRAM_STATS_MV_ID=<dune query id for program_stats>     # program usage
DUNE_PROGRAM_CALLS_MV_ID=<dune query id for program_call_stats> # historical CPI calls
```

> All routes require `Authorization: Bearer <CRON_SECRET>`; missing/invalid → **401**.

---

## Route 1 — Dune **Program Usage** Data

**File:** `app/api/cron/dune/program-info/route.ts`

**Purpose**
- Pulls **program usage** data from Dune (`DUNE_PROGRAM_STATS_MV_ID`). Replaces the `program_stats` table in a transaction.

**Flow**
1. Verify `Authorization: Bearer <CRON_SECRET>` → else **401**.
2. `client.getLatestResult({ queryId: Number(DUNE_PROGRAM_STATS_MV_ID) })`.
3. Map rows → `{ program_address, calling_programs_count, transaction_references_count, created_at }`.
4. Transaction: `DELETE FROM program_stats` → bulk `INSERT` mapped rows.

**Errors**
- SDK/DB failures → logged; return **500**.

---

## Route 2 — Dune **Historical CPI Calls** Import

**File:** `app/api/dune-program-calls/route.ts`

**Purpose**
- Pulls **historical CPI calls** aggregates from Dune (`DUNE_PROGRAM_CALLS_MV_ID`).
- Resolves names using static `PROGRAM_INFO_BY_ID`, Program Metadata IDL, then Dune fallback.
- Replaces `program_call_stats` and **cleans up** QuickNode rows up to the **max Dune block slot**.

**Flow**
1. Verify `Authorization: Bearer <CRON_SECRET>` → else **401**.
2. Fetch Dune latest results. Compute `maxBlockSlot` as `bigint` from `rows[].block_slot`.
3. `mapWithLimit(rows, 7, ...)` to build values: `{ address, program_address, name, description, calls_number, block_slot, created_at }`, with a `nameCache` to avoid repeat lookups.
4. Transaction:
   - `DELETE FROM program_call_stats`
   - bulk `INSERT` mapped values
   - cleanup:
     ```sql
     DELETE FROM quicknode_stream_cpi_program_calls
     WHERE fromBlockNumber <= :maxBlockSlot;
     ```

**Errors**
- Any SDK/DB failure → logged; return **500**.

---

## Notes

- **Idempotent** imports: Dune routes replace their tables fully; safe to re-run.
- **MV refresh**: Uses `CONCURRENTLY`; conflicts are logged and retried by the next schedule.
- **Observability**: Log row counts and durations per stage.

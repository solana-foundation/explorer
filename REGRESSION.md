# Regression Testing: Buffer to Uint8Array Migration

This document lists all locations where `Buffer.from(x, 'base64')` / `buffer.toString('base64')` were replaced with `fromBase64()` / `toBase64()` helpers.

## Test URLs

| Feature | Local | Production |
|---------|-------|------------|
| Base URL | http://localhost:3000 | https://explorer.solana.com |

---

## 1. Downloadable Component

**File:** `app/components/common/Downloadable.tsx`

**Change:** `Buffer.from(data, 'base64')` → `fromBase64(data)`

**Test:** Any page with downloadable base64 content (e.g., IDL downloads)

| Local | Production |
|-------|------------|
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 2. NFToken Account Parsing

**File:** `app/components/account/nftoken/isNFTokenAccount.ts`

**Change:** `Buffer.from(parsed.discriminator).toString('base64')` → `toBase64(new Uint8Array(parsed.discriminator))`

**Test:** NFToken account pages

| Local | Production |
|-------|------------|
| http://localhost:3000/address/NFTUkR4u7wKxy9QLaX2TGvd9oZSWoMo4jqSJqdMb7Nk?cluster=mainnet | https://explorer.solana.com/address/NFTUkR4u7wKxy9QLaX2TGvd9oZSWoMo4jqSJqdMb7Nk |

---

## 3. Ed25519 Signature Display

**File:** `app/components/instruction/ed25519/Ed25519DetailsCard.tsx`

**Change:** `Buffer.from(signature).toString('base64')` → `toBase64(signature)`

**Test:** Transaction with Ed25519 signature verification instruction

| Local | Production |
|-------|------------|
| http://localhost:3000/tx/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp...?cluster=mainnet | https://explorer.solana.com/tx/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp... |

*Note: Find a transaction that uses Ed25519 program for verification*

---

## 4. Program Events Card

**File:** `app/components/instruction/ProgramEventsCard.tsx`

**Change:** `Buffer.from(rawEventData, 'base64')` → `fromBase64(rawEventData)`

**Test:** Transaction with Anchor program events

| Local | Production |
|-------|------------|
| http://localhost:3000/tx/inspector?cluster=mainnet | https://explorer.solana.com/tx/inspector |

*Note: Use any Anchor program transaction that emits events*

---

## 5. Program Logs Card Body

**File:** `app/components/ProgramLogsCardBody.tsx`

**Change:** `Buffer.from(instruction.data, 'base64')` → `Buffer.from(fromBase64(instruction.data))` ⚠️ (redundant wrapper)

**Test:** Any transaction details page with program logs

| Local | Production |
|-------|------------|
| http://localhost:3000/tx/5wHu1qwD7q4KqgrCvAWNGP6Z9b9wNv...?cluster=mainnet | https://explorer.solana.com/tx/5wHu1qwD7q4KqgrCvAWNGP6Z9b9wNv... |

---

## 6. Anchor Event Decoding

**File:** `app/utils/anchor.tsx`

**Changes:**
- `Buffer.from(eventData, 'base64')` → `fromBase64(eventData)`
- `Buffer.from(paddedData).toString('base64')` → `toBase64(paddedData)`

**Test:** Transaction with Anchor program that has custom events

| Local | Production |
|-------|------------|
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 7. Token Account Parsing (Simulation)

**File:** `app/features/instruction-simulation/lib/tokenAccountParsing.ts`

**Change:** `Buffer.from(accountDataPost, 'base64')` → `fromBase64(accountDataPost)`

**Test:** Transaction inspector with token transfer simulation

| Local | Production |
|-------|------------|
| http://localhost:3000/tx/inspector?cluster=mainnet | https://explorer.solana.com/tx/inspector |

---

## 8. Simulation Results

**File:** `app/features/instruction-simulation/model/use-simulation.ts`

**Change:** `Buffer.from(accountDataPost!, 'base64')` → `fromBase64(accountDataPost!)`

**Test:** Transaction simulation in inspector

| Local | Production |
|-------|------------|
| http://localhost:3000/tx/inspector?cluster=mainnet | https://explorer.solana.com/tx/inspector |

---

## 9. Security.txt Parsing

**File:** `app/features/security-txt/lib/fromProgramData.ts`

**Change:** `Buffer.from(data, encoding)` → `fromBase64(data)`

**Test:** Program account with security.txt

| Local | Production |
|-------|------------|
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 10. Security.txt UI Utils

**File:** `app/features/security-txt/ui/utils.ts`

**Change:** `Buffer.from(JSON.stringify(data)).toString('base64')` → `toBase64(fromUtf8(JSON.stringify(data)))`

**Test:** Security.txt display on program pages

| Local | Production |
|-------|------------|
| http://localhost:3000/address/MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD?cluster=mainnet | https://explorer.solana.com/address/MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD |

---

## 11. IDL Section Download

**File:** `app/features/idl/ui/IdlSection.tsx`

**Change:** `Buffer.from(JSON.stringify(idl)).toString('base64')` → `toBase64(fromUtf8(JSON.stringify(idl)))`

**Test:** IDL download button on program pages

| Local | Production |
|-------|------------|
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 12. Trigger Download Utility

**File:** `app/shared/lib/triggerDownload.ts`

**Change:** `Buffer.from(data, 'base64')` → `fromBase64(data)`

**Test:** Any file download functionality

| Local | Production |
|-------|------------|
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 13. Verified Builds

**File:** `app/utils/verified-builds.tsx`

**Change:** `Buffer.from(programData.data[0], 'base64')` → `fromBase64(programData.data[0])`

**Test:** Program with verified build status

| Local | Production |
|-------|------------|
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## Quick Test Checklist

- [ ] **IDL Download**: Go to Jupiter program, click Download IDL, verify JSON file is valid
- [ ] **Security.txt**: Check program pages show security.txt info correctly
- [ ] **Transaction Logs**: Open any transaction, verify logs display correctly
- [ ] **Transaction Inspector**: Load a transaction in inspector, verify simulation works
- [ ] **Verified Builds**: Check verified build badge appears on supported programs
- [ ] **NFToken Accounts**: If available, verify NFToken account parsing works
- [ ] **Ed25519 Signatures**: Find Ed25519 transaction, verify signature display

---

## Sample Test Addresses/Transactions

### Programs with IDL
- Jupiter: `JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv`
- Marinade: `MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD`

### Token Accounts
- Any SPL token account for simulation testing

### Transactions
- Use recent transactions from the homepage for general testing

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

# Hex Encoding/Decoding Replacements

## 14. NFToken Discriminator (Hex)

**File:** `app/components/account/nftoken/nftoken.ts`

**Change:** `Buffer.from(nftokenAccountDiscInHex, 'hex')` → `fromHex(nftokenAccountDiscInHex)`

**Test:** NFToken collection fetching

| Local | Production |
|-------|------------|
| http://localhost:3000/address/NFTUkR4u7wKxy9QLaX2TGvd9oZSWoMo4jqSJqdMb7Nk?cluster=mainnet | https://explorer.solana.com/address/NFTUkR4u7wKxy9QLaX2TGvd9oZSWoMo4jqSJqdMb7Nk |

---

## 15. Anchor Self-CPI Tag (Hex)

**File:** `app/utils/anchor.tsx`

**Change:** `Buffer.from('1d9acb512ea545e4', 'hex').reverse()` → `fromHex('1d9acb512ea545e4').reverse()`

**Test:** Transaction with Anchor self-CPI instructions

| Local | Production |
|-------|------------|
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 16. HexData Component

**File:** `app/components/common/HexData.tsx`

**Change:** `raw.toString('hex')` → `toHex(raw)` (also changed prop type from `Buffer` to `Uint8Array`)

**Test:** Any page displaying hex data (e.g., raw instruction data)

| Local | Production |
|-------|------------|
| http://localhost:3000/tx/inspector?cluster=mainnet | https://explorer.solana.com/tx/inspector |

---

## 17. PDA Seed Builder (Hex)

**File:** `app/features/idl/interactive-idl/model/pda-generator/seed-builder.ts`

**Change:** `buffer.toString('hex')` → `toHex(buffer)` (also changed types from `Buffer` to `Uint8Array`)

**Test:** PDA generation in interactive IDL forms

| Local | Production |
|-------|------------|
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

*Note: Use interactive IDL form to generate PDAs*

---

## 18. Verified Builds Hash (Hex)

**File:** `app/utils/verified-builds.tsx`

**Change:** `Buffer.from(sha256(c)).toString('hex')` → `toHex(sha256(dataToHash))`

**Test:** Program verified build hash computation

| Local | Production |
|-------|------------|
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

# UTF-8 Encoding/Decoding Replacements

## 19. Security.txt Base64 Export (UTF-8)

**File:** `app/features/security-txt/ui/utils.ts`

**Change:** `Buffer.from(JSON.stringify(data, null, 2)).toString('base64')` → `toBase64(fromUtf8(JSON.stringify(data, null, 2)))`

**Test:** Security.txt display and export on program pages

| Local | Production |
|-------|------------|
| http://localhost:3000/address/MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD?cluster=mainnet | https://explorer.solana.com/address/MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD |

---

## 20. IDL Section Base64 Export (UTF-8)

**File:** `app/features/idl/ui/IdlSection.tsx`

**Change:** `Buffer.from(JSON.stringify(idl, null, 2)).toString('base64')` → `toBase64(fromUtf8(JSON.stringify(idl, null, 2)))`

**Test:** IDL download button on program pages

| Local | Production |
|-------|------------|
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 21. PDA Seed Builder String/Bytes (UTF-8)

**File:** `app/features/idl/interactive-idl/model/pda-generator/seed-builder.ts`

**Change:** `Buffer.from(value)` → `fromUtf8(value)` (for string/bytes types)

**Test:** PDA generation with string seeds in interactive IDL forms

| Local | Production |
|-------|------------|
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

*Note: Use interactive IDL form with string-type PDA seeds*

---

## 22. Anchor Interpreter Bytes Conversion (UTF-8)

**File:** `app/features/idl/interactive-idl/model/anchor/anchor-interpreter.ts`

**Change:** `Buffer.from(value)` → `fromUtf8(value)` (for bytes and defined types)

**Test:** Anchor instruction building with bytes arguments

| Local | Production |
|-------|------------|
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 23. Verified Builds Otter Verify PDA (UTF-8)

**File:** `app/utils/verified-builds.tsx`

**Change:** `Buffer.from('otter_verify')` → `fromUtf8('otter_verify')`

**Test:** Verified build status check using OtterSec verification

| Local | Production |
|-------|------------|
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 24. Kit Wrapper String Decoding (UTF-8)

**File:** `app/utils/kit-wrapper.tsx`

**Change:** `Buffer.from(data).toString('utf-8')` → `toUtf8(new Uint8Array(data))`

**Test:** Solana Kit integration string decoding

| Local | Production |
|-------|------------|
| http://localhost:3000/tx/inspector?cluster=mainnet | https://explorer.solana.com/tx/inspector |

---

## Quick Test Checklist

### Base64 Conversions
- [ ] **IDL Download**: Go to Jupiter program, click Download IDL, verify JSON file is valid
- [ ] **Security.txt**: Check program pages show security.txt info correctly
- [ ] **Transaction Logs**: Open any transaction, verify logs display correctly
- [ ] **Transaction Inspector**: Load a transaction in inspector, verify simulation works
- [ ] **Verified Builds**: Check verified build badge appears on supported programs
- [ ] **NFToken Accounts**: If available, verify NFToken account parsing works
- [ ] **Ed25519 Signatures**: Find Ed25519 transaction, verify signature display

### Hex Conversions
- [ ] **Hex Data Display**: In transaction inspector, verify hex data displays correctly
- [ ] **PDA Generation**: Use interactive IDL form, verify PDA seeds show correct hex values
- [ ] **Verified Build Hash**: Verify program hash matches expected value on verified programs
- [ ] **Anchor Self-CPI**: Find transaction with Anchor self-CPI, verify detection works

### UTF-8 Conversions
- [ ] **IDL Download**: Go to Jupiter program, click Download IDL, verify JSON file contains valid UTF-8 characters
- [ ] **Security.txt Export**: Check security.txt base64 export works correctly
- [ ] **PDA String Seeds**: Use interactive IDL with string seeds, verify PDA generation works
- [ ] **Verified Builds**: Verify OtterSec verification check works

---

## Sample Test Addresses/Transactions

### Programs with IDL
- Jupiter: `JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv`
- Marinade: `MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD`

### Token Accounts
- Any SPL token account for simulation testing

### Transactions
- Use recent transactions from the homepage for general testing

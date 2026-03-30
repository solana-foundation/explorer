# Regression Testing: Buffer to Uint8Array Migration

This document tracks the `Buffer` -> `Uint8Array` migration and the remaining intentional Buffer interop boundaries.

## Migration Policy

- Application code should prefer `Uint8Array` and helpers from `app/shared/lib/bytes.ts`.
- `app/shared/lib/bytes.ts` is the only app-owned place that should construct `Buffer`.
- `toBuffer(...)` is the approved adapter when external libraries still require `Buffer`.
- Some SDK/library boundaries intentionally remain Buffer-backed and are called out below.

## Test URLs

| Feature  | Local                 | Production                  |
| -------- | --------------------- | --------------------------- |
| Base URL | http://localhost:3000 | https://explorer.solana.com |

---

## 1. Downloadable Component

**File:** `app/components/common/Downloadable.tsx`

**Change:** `Buffer.from(data, 'base64')` → `fromBase64(data)`

**Test:** Any page with downloadable base64 content (e.g., IDL downloads)

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 2. NFToken Account Parsing

**File:** `app/components/account/nftoken/isNFTokenAccount.ts`

**Change:** `Buffer.from(parsed.discriminator).toString('base64')` → `toBase64(new Uint8Array(parsed.discriminator))`

**Test:** NFToken account pages

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/NFTUkR4u7wKxy9QLaX2TGvd9oZSWoMo4jqSJqdMb7Nk?cluster=mainnet | https://explorer.solana.com/address/NFTUkR4u7wKxy9QLaX2TGvd9oZSWoMo4jqSJqdMb7Nk |

---

## 3. Ed25519 Signature Display

**File:** `app/components/instruction/ed25519/Ed25519DetailsCard.tsx`

**Changes:**

-   `Buffer.from(signature).toString('base64')` → `toBase64(signature)`
-   instruction decoding changed from Buffer read APIs to shared `Uint8Array` byte helpers in `app/shared/lib/bytes.ts`

**Test:** Transaction with Ed25519 signature verification instruction

| Local                                                                        | Production                                                         |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| http://localhost:3000/tx/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp...?cluster=mainnet | https://explorer.solana.com/tx/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp... |

_Note: Find a transaction that uses Ed25519 program for verification_

---

## 4. Program Events Card

**File:** `app/components/instruction/ProgramEventsCard.tsx`

**Change:** `Buffer.from(rawEventData, 'base64')` → `fromBase64(rawEventData)`

**Test:** Transaction with Anchor program events

| Local                                              | Production                               |
| -------------------------------------------------- | ---------------------------------------- |
| http://localhost:3000/tx/inspector?cluster=mainnet | https://explorer.solana.com/tx/inspector |

_Note: Use any Anchor program transaction that emits events_

---

## 5. Program Logs Card Body

**File:** `app/components/ProgramLogsCardBody.tsx`

**Change:** direct `Buffer.from(...)` wrappers → `toBuffer(...)` only where `TransactionInstruction` still requires Buffer interop

**Note:** base64 decoding still uses `fromBase64(...)`; Buffer interop is centralized through `toBuffer(...)`.

**Test:** Any transaction details page with program logs

| Local                                                                      | Production                                                       |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| http://localhost:3000/tx/5wHu1qwD7q4KqgrCvAWNGP6Z9b9wNv...?cluster=mainnet | https://explorer.solana.com/tx/5wHu1qwD7q4KqgrCvAWNGP6Z9b9wNv... |

---

## 6. Anchor Event Decoding

**File:** `app/utils/anchor.tsx`

**Changes:**

-   `Buffer.from(eventData, 'base64')` → `fromBase64(eventData)`
-   `Buffer.from(paddedData).toString('base64')` → `toBase64(paddedData)`

**Test:** Transaction with Anchor program that has custom events

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 6a. Anchor Details Card Event Base64 Encoding

**File:** `app/components/instruction/AnchorDetailsCard.tsx`

**Change:** `ix.data.slice(8).toString('base64')` → `toBase64(ix.data.slice(8))`

**Test:** Anchor self-CPI / event transactions still decode event payloads correctly

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 7. Token Account Parsing (Simulation)

**File:** `app/features/instruction-simulation/lib/tokenAccountParsing.ts`

**Change:** `Buffer.from(accountDataPost, 'base64')` → `fromBase64(accountDataPost)`

**Test:** Transaction inspector with token transfer simulation

| Local                                              | Production                               |
| -------------------------------------------------- | ---------------------------------------- |
| http://localhost:3000/tx/inspector?cluster=mainnet | https://explorer.solana.com/tx/inspector |

---

## 8. Simulation Results

**File:** `app/features/instruction-simulation/model/use-simulation.ts`

**Change:** `Buffer.from(accountDataPost!, 'base64')` → `fromBase64(accountDataPost!)`

**Test:** Transaction simulation in inspector

| Local                                              | Production                               |
| -------------------------------------------------- | ---------------------------------------- |
| http://localhost:3000/tx/inspector?cluster=mainnet | https://explorer.solana.com/tx/inspector |

---

## 9. Security.txt Parsing

**File:** `app/features/security-txt/lib/fromProgramData.ts`

**Change:** `Buffer.from(data, encoding)` → `fromBase64(data)`

**Test:** Program account with security.txt

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 10. Security.txt UI Utils

**File:** `app/features/security-txt/ui/utils.ts`

**Change:** `Buffer.from(JSON.stringify(data)).toString('base64')` → `toBase64(fromUtf8(JSON.stringify(data)))`

**Test:** Security.txt display on program pages

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD?cluster=mainnet | https://explorer.solana.com/address/MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD |

---

## 11. IDL Section Download

**File:** `app/features/idl/ui/IdlSection.tsx`

**Change:** `Buffer.from(JSON.stringify(idl)).toString('base64')` → `toBase64(fromUtf8(JSON.stringify(idl)))`

**Test:** IDL download button on program pages

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 12. Trigger Download Utility

**File:** `app/shared/lib/triggerDownload.ts`

**Change:** `Buffer.from(data, 'base64')` → `fromBase64(data)`

**Test:** Any file download functionality

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 13. Verified Builds

**File:** `app/utils/verified-builds.tsx`

**Change:** `Buffer.from(programData.data[0], 'base64')` → `fromBase64(programData.data[0])`

**Test:** Program with verified build status

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

# Hex Encoding/Decoding Replacements

## 14. NFToken Discriminator (Hex)

**File:** `app/components/account/nftoken/nftoken.ts`

**Change:** `Buffer.from(nftokenAccountDiscInHex, 'hex')` → `fromHex(nftokenAccountDiscInHex)`

**Test:** NFToken collection fetching

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/NFTUkR4u7wKxy9QLaX2TGvd9oZSWoMo4jqSJqdMb7Nk?cluster=mainnet | https://explorer.solana.com/address/NFTUkR4u7wKxy9QLaX2TGvd9oZSWoMo4jqSJqdMb7Nk |

---

## 15. Anchor Self-CPI Tag (Hex)

**File:** `app/utils/anchor.tsx`

**Change:** `Buffer.from('1d9acb512ea545e4', 'hex').reverse()` → `fromHex('1d9acb512ea545e4').reverse()`

**Test:** Transaction with Anchor self-CPI instructions

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 16. HexData Component

**File:** `app/components/common/HexData.tsx`

**Change:** `raw.toString('hex')` → `toHex(raw)` (also changed prop type from `Buffer` to `Uint8Array`)

**Test:** Pages displaying raw instruction data in hex format

**Used in:**

-   `BaseRawDetails` → instruction cards showing raw hex data
-   `ProgramEventsCard` → raw event data display
-   Transaction Inspector → unknown instruction cards

| Local                                                                                                                             | Production                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| http://localhost:3000/tx/inspector?cluster=mainnet                                                                                | https://explorer.solana.com/tx/inspector                                                                                |
| http://localhost:3000/tx/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d6G6PP6V7eMLoUpYA1uoJeWs2XNmey8q1aMiP4stXm6Ar?cluster=mainnet | https://explorer.solana.com/tx/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d6G6PP6V7eMLoUpYA1uoJeWs2XNmey8q1aMiP4stXm6Ar |

_Note: Open "Raw" tab on any instruction card to see HexData component_

---

## 17. PDA Seed Builder (Hex)

**File:** `app/features/idl/interactive-idl/model/pda-generator/seed-builder.ts`

**Change:** `buffer.toString('hex')` → `toHex(buffer)` (also changed types from `Buffer` to `Uint8Array`)

**Test:** PDA generation in interactive IDL forms

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

_Note: Use interactive IDL form to generate PDAs_

---

## 18. Verified Builds Hash (Hex)

**File:** `app/utils/verified-builds.tsx`

**Change:** `Buffer.from(sha256(c)).toString('hex')` → `toHex(sha256(dataToHash))`

**Test:** Program verified build hash computation

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

# UTF-8 Encoding/Decoding Replacements

## 19. Security.txt Base64 Export (UTF-8)

**File:** `app/features/security-txt/ui/utils.ts`

**Change:** `Buffer.from(JSON.stringify(data, null, 2)).toString('base64')` → `toBase64(fromUtf8(JSON.stringify(data, null, 2)))`

**Test:** Security.txt display and export on program pages

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD?cluster=mainnet | https://explorer.solana.com/address/MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD |

---

## 20. IDL Section Base64 Export (UTF-8)

**File:** `app/features/idl/ui/IdlSection.tsx`

**Change:** `Buffer.from(JSON.stringify(idl, null, 2)).toString('base64')` → `toBase64(fromUtf8(JSON.stringify(idl, null, 2)))`

**Test:** IDL download button on program pages

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 21. PDA Seed Builder String/Bytes (UTF-8)

**File:** `app/features/idl/interactive-idl/model/pda-generator/seed-builder.ts`

**Change:** `Buffer.from(value)` → `fromUtf8(value)` (for string/bytes types)

**Test:** PDA generation with string seeds in interactive IDL forms

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

_Note: Use interactive IDL form with string-type PDA seeds_

---

## 22. Anchor Interpreter Bytes Conversion (UTF-8)

**File:** `app/features/idl/interactive-idl/model/anchor/anchor-interpreter.ts`

**Change:** `Buffer.from(value)` → `fromUtf8(value)` (for bytes and defined types)

**Test:** Anchor instruction building with bytes arguments

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 23. Verified Builds Otter Verify PDA (UTF-8)

**File:** `app/utils/verified-builds.tsx`

**Change:** `Buffer.from('otter_verify')` → `fromUtf8('otter_verify')`

**Test:** Verified build status check using OtterSec verification

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 24. Kit Wrapper String Decoding (UTF-8)

**File:** `app/utils/kit-wrapper.tsx`

**Change:** `Buffer.from(data).toString('utf-8')` → `toUtf8(new Uint8Array(data))`

**Test:** Solana Kit integration string decoding

| Local                                              | Production                               |
| -------------------------------------------------- | ---------------------------------------- |
| http://localhost:3000/tx/inspector?cluster=mainnet | https://explorer.solana.com/tx/inspector |

---

## 25. SearchBar Base64 Validation

**File:** `app/components/SearchBar.tsx` (uses `app/shared/lib/bytes.ts`)

**Change:** Simplified `isValidBase64()` to use `fromBase64()` with try/catch instead of regex + atob

**Test:** Search bar accepts valid base64-encoded data

| Local                  | Production                   |
| ---------------------- | ---------------------------- |
| http://localhost:3000/ | https://explorer.solana.com/ |

_Test: Enter a valid base64 string in search bar (e.g., transaction signature in base64)_

---

# Buffer.alloc Replacements

## 26. Inspector Parsed Data (alloc)

**File:** `app/components/inspector/into-parsed-data.ts`

**Change:** `Buffer.alloc(CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR)` → `alloc(CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR)`

**Test:** Transaction inspector with Associated Token Program instructions

| Local                                              | Production                               |
| -------------------------------------------------- | ---------------------------------------- |
| http://localhost:3000/tx/inspector?cluster=mainnet | https://explorer.solana.com/tx/inspector |

_Test: Load a transaction with ATA creation instruction_

---

## 27. Account Provider Empty Data (alloc)

**File:** `app/providers/accounts/index.tsx`

**Change:** `Buffer.alloc(0)` → `alloc(0)`

**Test:** Account pages for non-existent accounts

| Local                                                                          | Production                                                           |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| http://localhost:3000/address/11111111111111111111111111111112?cluster=mainnet | https://explorer.solana.com/address/11111111111111111111111111111112 |

_Test: Load any non-existent account address_

---

## 28. Pyth LPString Decoder (UTF-8)

**File:** `app/components/instruction/pyth/program.ts`

**Changes:**

-   `uint8ArrayToBuffer(b).slice(...).toString('utf-8')` → `toUtf8(b.slice(...))`
-   `decodeData(..., buffer: Buffer)` widened to `decodeData(..., buffer: Uint8Array)`

**Test:** Transaction with Pyth oracle instructions

| Local                                                                                      | Production                                                                       |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| http://localhost:3000/address/FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH?cluster=mainnet | https://explorer.solana.com/address/FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH |

_Note: Pyth program address for testing oracle-related transactions_

---

## 29. AccountData.raw Type Change

**File:** `app/providers/accounts/index.tsx`

**Changes:**

-   `raw?: Buffer` → `raw?: Uint8Array` in `AccountData` interface
-   local raw-data handling now uses `Uint8Array | undefined` instead of `Buffer | undefined`

**Test:** All account pages that access raw data

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

# Buffer.from Compatibility Wrappers

These locations retain Buffer interop because external libraries still require `Buffer` type. Application code should call `toBuffer(...)` from `app/shared/lib/bytes.ts` instead of `Buffer.from(...)` directly.

## 30. Anchor Account Decoding

**File:** `app/components/account/AnchorAccountCard.tsx`

**Kept:** `toBuffer(rawData)` wrapper for `coder.decode()`

**Reason:** `@coral-xyz/anchor` `BorshAccountsCoder.decode()` expects `Buffer` parameter

**Test:** Anchor program account pages with decoded data

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 31. Compressed NFT Merkle Tree

**File:** `app/components/account/CompressedNFTInfoCard.tsx`

**Kept:** `toBuffer(treeAccountInfo.data.data.raw)` wrapper for `ConcurrentMerkleTreeAccount.fromBuffer()`

**Reason:** `@solana/spl-account-compression` `ConcurrentMerkleTreeAccount.fromBuffer()` signature requires `Buffer`

**Test:** Compressed NFT account pages

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/SMBH3wF6baUj6JWtzYvqcKuj2XCKWDqQxzspY12xPND?cluster=mainnet | https://explorer.solana.com/address/SMBH3wF6baUj6JWtzYvqcKuj2XCKWDqQxzspY12xPND |

_Note: Compressed NFT example address_

---

## 32. TransactionInstruction Data

**Files:**

-   `app/components/ProgramLogsCardBody.tsx`
-   `app/components/inspector/utils.ts`

**Kept:** `toBuffer(...)` wrapper when constructing `TransactionInstruction`

**Reason:** `@solana/web3.js` types still require `Buffer` for `data` in these paths

**Test:** Transaction pages with program logs and transaction inspector flows

| Local                                                                                                                            | Production                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| http://localhost:3000/tx/inspector?cluster=mainnet                                                                               | https://explorer.solana.com/tx/inspector                                                                                |
| http://localhost:3000/tx/44Z9x5jpA9MzimpKq7ididJUdzjzuUpHjPmi8PjTLExRWddwgbThdnhs2ipKsJi6M8bM2iGKMag4nF7UniXLnDtH?cluster=devnet | https://explorer.solana.com/tx/2xiTSpSLwZ46Pr9om4rXKXZdGNunwRpLArimTLdndfrx1yVJaBSUayndorZ1Y6DL3ZTkXGFXQkYXsdK9T3xaiacd |

---

## 33. Transaction Message Serialization

**File:** `app/features/idl/interactive-idl/model/use-instruction.ts`

**Change:** manual `btoa` byte loop → `toBase64(transaction.serializeMessage())`

**Test:** Interactive IDL instruction execution and error display with serialized transaction message

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv?cluster=mainnet | https://explorer.solana.com/address/JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv |

---

## 34. Inspector Associated Token Discriminator

**File:** `app/components/inspector/into-parsed-data.ts`

**Change:** `Buffer.from([discriminator])` → `bytes([discriminator])`, with `toBuffer(...)` only at the final interop boundary

**Test:** Transaction inspector with Associated Token Program `create` instruction

| Local                                                                                                                                     | Production                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| http://localhost:3000/tx/inspector?cluster=mainnet                                                                                        | https://explorer.solana.com/tx/inspector                                                                                        |
| http://localhost:3000/tx/2crntTzKKWQ87sTXyCmDFLYNuGme1Cponcvz5SD2DQNdDtvLStbpEZg2Pk5VQVjJ2M5BpUmg5gbU3W3EVgpvkUmM/inspect?cluster=mainnet | https://explorer.solana.com/tx/2crntTzKKWQ87sTXyCmDFLYNuGme1Cponcvz5SD2DQNdDtvLStbpEZg2Pk5VQVjJ2M5BpUmg5gbU3W3EVgpvkUmM/inspect |

---

## 35. Serum Instruction Code Parsing

**File:** `app/components/instruction/serum/types.ts`

**Change:** `instruction.data.slice(1, 5).readUInt32LE(0)` → `readUint32LE(instruction.data.slice(1, 5), 0)` via `app/shared/lib/bytes.ts`

**Test:** Serum / OpenBook transaction pages that decode instruction titles

Serum Program ids: `srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX`, `4ckmDgGdxQoPDLUkDT3vHgSAkzA3QRdNq5ywwY4sUSJn`,
`9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin`,

| Local                                                                                                                             | Production                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| http://localhost:3000/tx/inspector?cluster=mainnet                                                                                | https://explorer.solana.com/tx/inspector                                                                                |
| http://localhost:3000/tx/35oVAqDXbd4cukgWL34KtBj1Ldp48idpMTtfWpD5j7bSneGse2bQSsZxSpyAyhvnyc9yFNM8dyyZxv4dM6njRoye?cluster=mainnet | https://explorer.solana.com/tx/35oVAqDXbd4cukgWL34KtBj1Ldp48idpMTtfWpD5j7bSneGse2bQSsZxSpyAyhvnyc9yFNM8dyyZxv4dM6njRoye |

---

## 36. Concurrent Merkle Tree Card

**File:** `app/components/account/ConcurrentMerkleTreeCard.tsx`

**Changes:**

-   Prop type `data: Buffer` → `data: Uint8Array`
-   `ConcurrentMerkleTreeAccount.fromBuffer(Buffer.from(data))` → `ConcurrentMerkleTreeAccount.fromBuffer(toBuffer(data))`

**Reason:** `@solana/spl-account-compression` `ConcurrentMerkleTreeAccount.fromBuffer()` requires `Buffer`

**Test:** Concurrent Merkle Tree account pages (related to compressed NFTs)

| Local                                                                                     | Production                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| http://localhost:3000/address/SMBH3wF6baUj6JWtzYvqcKuj2XCKWDqQxzspY12xPND?cluster=mainnet | https://explorer.solana.com/address/SMBH3wF6baUj6JWtzYvqcKuj2XCKWDqQxzspY12xPND |

---

## 37. SAS Attestation Data Card

**File:** `app/components/account/sas/AttestationDataCard.tsx`

**Change:** `Buffer.from(attestation.data).toString('base64')` → `toBase64(new Uint8Array(attestation.data))`

**Test:** SAS attestation account pages with attestation data display

| Local                                              | Production                               |
| -------------------------------------------------- | ---------------------------------------- |
| http://localhost:3000/tx/inspector?cluster=mainnet | https://explorer.solana.com/tx/inspector |

- Schema https://explorer.solana.com/address/9FQiiMtroSHP2Ewqfh3D94GPKnDjmeLT2ftqJ3E7QyWc
- Credential https://explorer.solana.com/address/2chgBfvkwhnHQVVAyXKDK6CBjbCRMQ8aLWrysL5UQyyF
- Attestation https://explorer.solana.com/address/EFsjVQHpTn7W5ZpjUh7dLZujHpnwUiDUNz7JbtnQqieb

_Note: Find an account with SAS attestation data_

---

## 38. Inspector Page Base64 and Buffer.from Removal

**File:** `app/components/inspector/InspectorPage.tsx`

**Changes:**

-   `Buffer.from(instruction.data)` → `instruction.data` (data is already `Uint8Array`, wrapper was unnecessary)
-   `btoa(String.fromCharCode.apply(null, Array.from(inspectorData.rawMessage)))` → `toBase64(inspectorData.rawMessage)`

**Test:** Transaction inspector — load Squads multisig transactions and verify raw message encoding

| Local                                              | Production                               |
| -------------------------------------------------- | ---------------------------------------- |
| http://localhost:3000/tx/inspector?cluster=mainnet | https://explorer.solana.com/tx/inspector |

---

## 39. Compute Units Schedule

**File:** `app/utils/compute-units-schedule.ts`

**Change:** `Buffer.from(instruction.data)` → `instruction.data` (data is already `Uint8Array`, wrapper was unnecessary)

**Test:** Any transaction page that displays compute unit information

| Local                                                                                                                             | Production                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| http://localhost:3000/tx/inspector?cluster=mainnet                                                                                | https://explorer.solana.com/tx/inspector                                                                                |
| http://localhost:3000/tx/3mirX6YW4dPwHqpnKwERk6hNoHB2vTFaxuqpAtFNVQz2wixMoKGMMUdUeqPDMf3Lo8TQAQFTLd4E2xKCbQwcc4z?cluster=mainnet | https://explorer.solana.com/tx/3mirX6YW4dPwHqpnKwERk6hNoHB2vTFaxuqpAtFNVQz2wixMoKGMMUdUeqPDMf3Lo8TQAQFTLd4E2xKCbQwcc4z |

---

## Quick Test Checklist

### Base64 Conversions

-   [ ] **IDL Download**: Go to Jupiter program, click Download IDL, verify JSON file is valid
-   [ ] **Security.txt**: Check program pages show security.txt info correctly
-   [ ] **Transaction Logs**: Open any transaction, verify logs display correctly
-   [ ] **Transaction Inspector**: Load a transaction in inspector, verify simulation works
-   [ ] **Interactive IDL Errors**: Trigger an instruction error and verify serialized transaction message is still valid base64
-   [ ] **Verified Builds**: Check verified build badge appears on supported programs
-   [ ] **NFToken Accounts**: If available, verify NFToken account parsing works
-   [ ] **Ed25519 Signatures**: Find Ed25519 transaction, verify signature display
-   [ ] **Anchor Self-CPI Events**: Verify Anchor self-CPI / event decoding still works with `toBase64(...)`

### Hex Conversions

-   [ ] **Hex Data Display**: In transaction inspector, verify hex data displays correctly
-   [ ] **PDA Generation**: Use interactive IDL form, verify PDA seeds show correct hex values
-   [ ] **Verified Build Hash**: Verify program hash matches expected value on verified programs
-   [ ] **Anchor Self-CPI**: Find transaction with Anchor self-CPI, verify detection works
-   [ ] **Serum/OpenBook Titles**: Verify Serum/OpenBook instruction titles still decode correctly

### UTF-8 Conversions

-   [ ] **IDL Download**: Go to Jupiter program, click Download IDL, verify JSON file contains valid UTF-8 characters
-   [ ] **Security.txt Export**: Check security.txt base64 export works correctly
-   [ ] **PDA String Seeds**: Use interactive IDL with string seeds, verify PDA generation works
-   [ ] **Verified Builds**: Verify OtterSec verification check works

### Buffer.alloc Replacements

-   [ ] **Transaction Inspector**: Load ATA creation transaction, verify parsing works correctly
-   [ ] **Non-existent Account**: Load a non-existent account address, verify page loads without errors

### Intentional Buffer Interop

-   [ ] **Anchor Account Decode**: Verify Anchor account decoding still works via `toBuffer(...)`
-   [ ] **Compressed NFT Tree**: Verify compressed NFT canopy depth still loads correctly via `toBuffer(...)`
-   [ ] **Concurrent Merkle Tree Card**: Verify concurrent merkle tree data renders correctly via `toBuffer(...)`
-   [ ] **Program Logs / Inspector**: Verify `TransactionInstruction` construction still works with `toBuffer(...)`

### Buffer.from Removals

-   [ ] **Inspector Page**: Load a Squads multisig transaction in inspector, verify instruction data and raw message encoding work
-   [ ] **Compute Units**: Open any transaction page with compute budget instructions, verify CU schedule displays correctly

### Additional Base64 Conversions

-   [ ] **SAS Attestation**: Find an account with SAS attestation data, verify base64 data displays correctly

---

## Sample Test Addresses/Transactions

### Programs with IDL

-   Jupiter: `JUP6LkMUe1WjxTH7NJD5o3RQGTX8Zdb5v3aKC1oNnLv`
-   Marinade: `MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD`

### Token Accounts

-   Any SPL token account for simulation testing

### Transactions

-   Use recent transactions from the homepage for general testing

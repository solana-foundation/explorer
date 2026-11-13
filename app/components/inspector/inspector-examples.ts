import { enums, is } from 'superstruct';

export const EXAMPLE_ENCODINGS = ['base64', 'base58'] as const;
export type ExampleEncoding = (typeof EXAMPLE_ENCODINGS)[number];

/**
 * Search param that keeps the examples' encoding, shared by every tab that offers the choice, so a shared link
 * opens on the same choice.
 */
export const ENCODING_PARAM = 'encoding';
/** Reads the encoding search param; anything other than a known encoding falls back to base64. */
export function parseExampleEncoding(value: string | null | undefined): ExampleEncoding {
    return is(value, enums([...EXAMPLE_ENCODINGS])) ? value : 'base64';
}

export type CodeSample = { code: string; focus: string };

// Placeholder values, shaped like base58 addresses but readable as made up, so nobody mistakes an example for a
// real account or pastes it expecting a result.
const FROM = 'SenderWa11et111111111111111111111111111111';
const TO = 'RecipientWa11et11111111111111111111111111';
const BLOCKHASH = 'RecentB1ockhash1111111111111111111111111111';

// `--sign-only` with pubkey signers prints the message without a keypair or an RPC call.
export const EXAMPLE_CLI_COMMAND = `solana transfer ${TO} 0.1 \\
  --from ${FROM} \\
  --fee-payer ${FROM} \\
  --blockhash ${BLOCKHASH} \\
  --sign-only --dump-transaction-message`;
export const EXAMPLE_CLI_FOCUS = '--dump-transaction-message';

/** The line that prints the message in each encoding; the Rust instruction chip shows the same line. */
export const RUST_PRINT_LINE: Record<ExampleEncoding, string> = {
    base58: 'println!("{}", bs58::encode(transaction.message_data()).into_string());',
    base64: 'println!("{}", STANDARD.encode(transaction.message_data()));',
};
/** The crate the print line needs. */
export const RUST_ENCODING_CRATE: Record<ExampleEncoding, string> = { base58: 'bs58', base64: 'base64' };

// `base64`'s free `encode` is deprecated (since 0.21), so the print line goes through the `Engine` trait.
const RUST_ENCODING_USE: Record<ExampleEncoding, string> = {
    base58: '',
    base64: 'use base64::{engine::general_purpose::STANDARD, Engine as _};\n',
};

// Crate versions this compiles against; `full` and `bincode` gate the transaction type and the system
// instruction builders, so without those features the example does not build.
const RUST_CARGO: Record<ExampleEncoding, string> = {
    base58: `// Cargo.toml:
//   solana-sdk = { version = "5", features = ["full"] }
//   solana-system-interface = { version = "3", features = ["bincode"] }
//   bs58 = "0.5"
`,
    base64: `// Cargo.toml:
//   solana-sdk = { version = "5", features = ["full"] }
//   solana-system-interface = { version = "3", features = ["bincode"] }
//   base64 = "0.23"
`,
};

export function rustExample(encoding: ExampleEncoding): CodeSample {
    const focus = RUST_PRINT_LINE[encoding];
    return {
        // `transfer` moved out of `solana_sdk` into `solana-system-interface` in solana-sdk 3.0.
        code: `${RUST_CARGO[encoding]}${RUST_ENCODING_USE[encoding]}use solana_sdk::{hash::Hash, message::Message, pubkey, transaction::Transaction};
use solana_system_interface::instruction::transfer;
use std::str::FromStr;

fn main() {
    let from = pubkey!("${FROM}");
    let to = pubkey!("${TO}");
    let blockhash = Hash::from_str("${BLOCKHASH}").unwrap();
    let instruction = transfer(&from, &to, 100_000_000);
    let message = Message::new_with_blockhash(&[instruction], Some(&from), &blockhash);
    let transaction = Transaction::new_unsigned(message);
    ${focus}
}`,
        focus,
    };
}

const COMPILED_MESSAGE = 'getCompiledTransactionMessageEncoder().encode(compileTransactionMessage(message))';

/**
 * `@solana/kit` print lines: `message` prints the compiled message only (what web3.js 1.x `serializeMessage()`
 * gave), `wire` prints the whole transaction with its signature slots (what `serialize()` gave).
 */
export const TS_PRINT_LINES: Record<ExampleEncoding, { message: string; wire: string }> = {
    base58: {
        message: `console.log(getBase58Decoder().decode(${COMPILED_MESSAGE}));`,
        wire: 'console.log(getBase58Decoder().decode(getTransactionEncoder().encode(tx)));',
    },
    base64: {
        message: `console.log(getBase64Decoder().decode(${COMPILED_MESSAGE}));`,
        wire: 'console.log(getBase64EncodedWireTransaction(tx));',
    },
};

const KIT_ENCODE_IMPORTS: Record<ExampleEncoding, string> = {
    base58: 'getBase58Decoder, getTransactionEncoder',
    base64: 'getBase64EncodedWireTransaction',
};

/**
 * A SOL transfer built with `@solana/kit`. A no-op signer stands in for the payer, so the printed wire
 * transaction carries an empty signature slot, which the inspector accepts.
 */
export function kitExample(encoding: ExampleEncoding): CodeSample {
    const focus = TS_PRINT_LINES[encoding].wire.replace('(tx)', '(compileTransaction(message))');
    return {
        code: `import {
  address, appendTransactionMessageInstruction, blockhash, compileTransaction, createNoopSigner,
  createTransactionMessage, ${KIT_ENCODE_IMPORTS[encoding]}, lamports, pipe,
  setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";

const from = createNoopSigner(address("${FROM}"));
const message = pipe(
  createTransactionMessage({ version: 0 }),
  m => setTransactionMessageFeePayerSigner(from, m),
  m => setTransactionMessageLifetimeUsingBlockhash({ blockhash: blockhash("${BLOCKHASH}"), lastValidBlockHeight: 0n }, m),
  m => appendTransactionMessageInstruction(
    getTransferSolInstruction({ source: from, destination: address("${TO}"), amount: lamports(100_000_000n) }),
    m,
  ),
);
${focus}`,
        focus,
    };
}

export const EXAMPLE_SQUADS_VAULT_TRANSACTION = 'Vau1tTransaction111111111111111111111111111';
export const EXAMPLE_SQUADS_URL = `https://app.squads.so/squads/MySquad1111111111111111111111111111111111/transactions/${EXAMPLE_SQUADS_VAULT_TRANSACTION}`;

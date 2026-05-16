import { ComputeBudgetProgram, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import type { Connection } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';

const LAMPORTS_PER_SOL = 1_000_000_000;
const BUY_DISC = Buffer.from([0x66, 0x0e, 0x36, 0x71, 0x7a, 0x2b, 0x6a, 0x49]);
const SELL_DISC = Buffer.from([0x33, 0x20, 0x3e, 0x6b, 0x72, 0x58, 0x67, 0x4e]);
const PUMP_PROGRAM = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');

export async function getWalletBalance(connection: Connection, publicKey: PublicKey): Promise<number> {
  const balance = await connection.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

export async function buyToken(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  bondingCurve: PublicKey,
  associatedBondingCurve: PublicKey,
  amountSol: number,
  priorityFeeBps?: number,
): Promise<string> {
  const lamports = BigInt(Math.round(amountSol * LAMPORTS_PER_SOL));
  const balance = await connection.getBalance(payer.publicKey);
  if (balance < Number(lamports)) {
    throw new Error('Insufficient balance');
  }

  const data = Buffer.alloc(16);
  BUY_DISC.copy(data, 0);
  data.writeBigUInt64LE(lamports, 8);

  const instructions: TransactionInstruction[] = [];
  if (priorityFeeBps && priorityFeeBps > 0) {
    instructions.push(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFeeBps }),
    );
  }

  instructions.push(
    new TransactionInstruction({
      programId: PUMP_PROGRAM,
      keys: [
        { pubkey: bondingCurve, isSigner: false, isWritable: true },
        { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      ],
      data,
    }),
  );

  const latest = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction({
    feePayer: payer.publicKey,
    recentBlockhash: latest.blockhash,
  });
  tx.add(...instructions);
  tx.sign(payer);

  const raw = tx.serialize().toString('base64');
  const txid = await connection.sendRawTransaction(Buffer.from(raw, 'base64'), {
    skipPreflight: false,
    maxRetries: 3,
  });
  await connection.confirmTransaction(txid, 'confirmed');
  return txid;
}

export async function sellAllTokens(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  bondingCurve: PublicKey,
  associatedBondingCurve: PublicKey,
): Promise<string> {
  const ata = getAssociatedTokenAddressSync(mint, payer.publicKey);
  const balanceInfo = await connection.getTokenAccountBalance(ata);
  const amount = BigInt(balanceInfo.value.amount);
  if (amount <= 0) {
    throw new Error('No tokens to sell');
  }

  const data = Buffer.alloc(16);
  SELL_DISC.copy(data, 0);
  data.writeBigUInt64LE(amount, 8);

  const ix = new TransactionInstruction({
    programId: PUMP_PROGRAM,
    keys: [
      { pubkey: bondingCurve, isSigner: false, isWritable: true },
      { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
    ],
    data,
  });

  const latest = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction({
    feePayer: payer.publicKey,
    recentBlockhash: latest.blockhash,
  });
  tx.add(ix);
  tx.sign(payer);

  const raw = tx.serialize().toString('base64');
  const txid = await connection.sendRawTransaction(Buffer.from(raw, 'base64'), {
    skipPreflight: false,
    maxRetries: 3,
  });
  await connection.confirmTransaction(txid, 'confirmed');
  return txid;
}

export async function createGodModeSniper(connection: Connection, payer: Keypair): Promise<void> {
  const WebSocketCtor = (globalThis as any).WebSocket as new (url: string) => {
    on: (event: string, handler: Function) => void;
    send?: (data: string) => void;
    close?: () => void;
  };

  if (!WebSocketCtor) {
    throw new Error('WebSocket is not available');
  }

  return new Promise((resolve, reject) => {
    const ws = new WebSocketCtor('wss://pumpportal.fun/api/data');

    ws.on('open', () => {
      if (typeof ws.send === 'function') {
        ws.send(JSON.stringify({ method: 'subscribeNewToken' }));
      }
    });

    ws.on('message', async (raw: string) => {
      try {
        const msg = typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(raw.toString());
        if (msg.type !== 'newToken') return;

        const mint = new PublicKey(msg.mint);
        const bondingCurve = new PublicKey(msg.bondingCurve);
        const associatedBondingCurve = new PublicKey(msg.associatedBondingCurve);

        await buyToken(connection, payer, mint, bondingCurve, associatedBondingCurve, 0.005);
        await sellAllTokens(connection, payer, mint, bondingCurve, associatedBondingCurve);

        if (typeof ws.close === 'function') {
          ws.close();
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    ws.on('error', (error: Error) => {
      reject(error);
    });
  });
}

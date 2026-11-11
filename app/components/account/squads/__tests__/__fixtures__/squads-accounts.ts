import { PublicKey } from '@solana/web3.js';

import type { Account } from '@/app/providers/accounts';
import { SQUADS_V4_ADDRESS } from '@/app/providers/squadsMultisig';
import { fromBase64 } from '@/app/shared/lib/bytes';

// From Squads batch account Ap4q9ALq7Yr55tot7HWzfoPPpFH1bPYP1F6QWiKRJM9
export const BATCH_DATA = fromBase64(
    'nMJGLBZYiSybtkqiyGg4Qb1ffK+usZowFIrIYA+HgzA35nU45ih9IMiPKlWM4B4vRyDQpY8Um53tFJiCtVFOb6Y5NFv8qc3ngQAAAAAAAAD+APwCAAAAAgAAAA==',
);

// From Squads vault transaction account ASwDJP5mzxV1dfov2eQz5WAVEy833nwK17VLcjsrZsZf
export const VAULT_TRANSACTION_DATA = fromBase64(
    'qPqiZFEOos+fErS/xkrbJRCvXG3UbwrUsJlVxCt0e4xgzjQyewfzMULyaPFkYPsCiNMe9FN//udpL5PwKAM/1qdskrvY+9nLCAAAAAAAAAD/AP8AAAAAAQEECAAAANCjHLRKvgiq2AoZK5QSGOfYj5bTGybeyAspA1+XDrVyM90v0fImaE0NQYcSinPuk++6GJEe5cKJZ4w9p0mAYgkJKhPulcQcugimf1rGfo334doRYl4dZBN/j08jgwN/FDCuVi3sTsjyvqU+oP8oI/e92Q78flUtkwuKGo3ug/s7V4efG9ifzqH+b9ldMvB714n0oZVW1d6xudyfhcoWP+0CqPaRToihsOIQFT73Y64rAMK5PRbBJNLAU3oQBIAAAAan1RcZLFxRIYzJTD1K8X9Y2u4Im6H9ROPb2YoAAAAABqfVFxjHdMkoVmOYaR1etoteuKObS21cc1VbIQAAAAABAAAABQcAAAABAgMEBgcABAAAAAMAAAAAAAAA',
);

export function makeSquadsAccount(raw: Uint8Array): Account {
    return {
        data: { raw },
        executable: false,
        lamports: 0,
        owner: new PublicKey(SQUADS_V4_ADDRESS),
        pubkey: PublicKey.default,
    };
}

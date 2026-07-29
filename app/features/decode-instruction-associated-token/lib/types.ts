import { PublicKeyFromString } from '@validators/pubkey';
import { Infer, type } from 'superstruct';

/**
 * The field names below are the RPC `parsed.info` names, which this slice treats
 * as canonical. `@solana-program/token`'s byte decoder names the same accounts
 * differently (`payer`/`ata`/`owner`, `nestedAssociatedAccountAddress`, …), so
 * the parser maps the kit names onto these. Both decode paths feed base58
 * strings through these validators, which is what guarantees the two paths
 * produce structurally identical `info` objects holding `PublicKey` values.
 */

/**
 * Accounts for `create` and `createIdempotent`. The two instructions take the
 * identical six accounts in the identical order, so one validator serves both.
 */
export type CreateAccountsInfo = Infer<typeof CreateAccountsInfo>;
export const CreateAccountsInfo = type({
    account: PublicKeyFromString,
    mint: PublicKeyFromString,
    source: PublicKeyFromString,
    systemProgram: PublicKeyFromString,
    tokenProgram: PublicKeyFromString,
    wallet: PublicKeyFromString,
});

export type RecoverNestedInfo = Infer<typeof RecoverNestedInfo>;
export const RecoverNestedInfo = type({
    destination: PublicKeyFromString,
    nestedMint: PublicKeyFromString,
    nestedOwner: PublicKeyFromString,
    nestedSource: PublicKeyFromString,
    ownerMint: PublicKeyFromString,
    tokenProgram: PublicKeyFromString,
    wallet: PublicKeyFromString,
});

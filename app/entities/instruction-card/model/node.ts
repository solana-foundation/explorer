import type { ParsedInstruction, PublicKey, TransactionInstruction } from '@solana/web3.js';

/**
 * Everything a card needs to know about *which* instruction it renders.
 *
 * Cards take a single `node` instead of the previous prop spread
 * (`ix` + `index` + `childIndex` + `raw` + `innerCards`). Surface-level
 * concerns — `result`, `signature`, the shell, the address renderer — live in
 * `InstructionSurface` and never travel as props.
 */
export type InstructionNode = {
    /**
     * The one fact about the instruction a card may read. Named separately from
     * `ix` so that reshaping `ix` (below) touches no card: a card needs the
     * program id to hand to `InstructionFields`, and nothing else.
     */
    programId: PublicKey;
    ix: ParsedInstruction | TransactionInstruction;
    index: number;
    childIndex?: number;
    /** Raw form, when the card was reached through the RPC-parsed path. */
    raw?: TransactionInstruction;
    /**
     * CPI children. Not yet populated — `InstructionsSection` still builds
     * inner cards eagerly and hands them over as `innerCards` below. Once tree
     * construction moves out of the render pass, the view walks this and
     * `innerCards` goes away.
     */
    children?: InstructionNode[];
    /**
     * @deprecated Transitional. Pre-rendered inner cards from the legacy
     * pipeline. The card never reads this — only the view passes it to the
     * shell. Delete together with the eager building in `InstructionsSection`.
     */
    innerCards?: JSX.Element[];
};

import { mapCodamaIxArgsToRows } from '@components/instruction/codama/codamaUtils';
import {
    InstructionCardView,
    type InstructionNode,
    ProgramField,
    useInstructionSurface,
} from '@entities/instruction-card';
import type { DispatchResult } from '@entities/instruction-parser';
import type { TransactionInstruction } from '@solana/web3.js';
import { camelToTitleCase, capitalizeFirstLetter } from '@utils/index';

import { toLegacyPublicKey } from '@/app/shared/lib/web3js-compat';
import { BaseTable } from '@/app/shared/ui/Table';

import type { SolanaAttestationParsed } from '../lib/sas-parser';

const TITLE_PREFIX = 'Solana Attestation';

const SECTION_ROW_CLASS =
    'bg-dark-background text-dk-xs font-semibold uppercase tracking-[0.08em] text-dark-muted-foreground';

/** Counts the discriminator the struct always carries, so a single argument still reads as none. */
const ARGUMENT_KEY_THRESHOLD = 2;

type SolanaAttestationDetailsCardProps = {
    /** The dispatcher's verdict for a SAS instruction: decoded, or registered-but-unparsed. */
    ix: DispatchResult;
    /** Raw form, for the shell's account table and hex view. */
    raw: TransactionInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

/**
 * Draws its own rows rather than declaring `InstructionField` descriptors: the argument
 * table is three columns wide (name, type, value) and generated from a Codama struct, so
 * the account rows have to span the extra column to stay flush right.
 */
export function SolanaAttestationDetailsCard({
    ix,
    raw,
    index,
    innerCards,
    childIndex,
}: SolanaAttestationDetailsCardProps) {
    const node: InstructionNode = { childIndex, index, innerCards, ix: raw, programId: raw.programId };
    const { Address, showProgramField } = useInstructionSurface();

    if ('unknown' in ix) {
        return <InstructionCardView node={node} title={`${TITLE_PREFIX}: Unknown Instruction`} defaultRaw />;
    }

    const { info, type } = ix.parsed as SolanaAttestationParsed;
    const hasArguments = Object.keys(info.data).length > ARGUMENT_KEY_THRESHOLD;

    return (
        <InstructionCardView node={node} title={`${TITLE_PREFIX}: ${camelToTitleCase(type)}`}>
            {showProgramField && <ProgramField programId={node.programId} colSpan={2} />}
            <BaseTable.Row className={SECTION_ROW_CLASS}>
                <BaseTable.Cell>Account Name</BaseTable.Cell>
                <BaseTable.Cell className="text-right" colSpan={2}>
                    Address
                </BaseTable.Cell>
            </BaseTable.Row>
            {Object.entries(info.accounts).map(([accountName, account]) => (
                <BaseTable.Row key={accountName}>
                    <BaseTable.Cell>{capitalizeFirstLetter(accountName)}</BaseTable.Cell>
                    <BaseTable.Cell className="text-right" colSpan={2}>
                        <Address pubkey={toLegacyPublicKey(account.address)} />
                    </BaseTable.Cell>
                </BaseTable.Row>
            ))}

            {hasArguments && (
                <>
                    <BaseTable.Row className={SECTION_ROW_CLASS}>
                        <BaseTable.Cell>Argument Name</BaseTable.Cell>
                        <BaseTable.Cell>Type</BaseTable.Cell>
                        <BaseTable.Cell className="text-right">Value</BaseTable.Cell>
                    </BaseTable.Row>
                    {mapCodamaIxArgsToRows(info.data)}
                </>
            )}
        </InstructionCardView>
    );
}

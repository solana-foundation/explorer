import { AccountMeta } from '@solana/kit';
import { PublicKey, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import {
    identifySolanaAttestationServiceInstruction,
    parseChangeAuthorizedSignersInstruction,
    parseChangeSchemaDescriptionInstruction,
    parseChangeSchemaStatusInstruction,
    parseChangeSchemaVersionInstruction,
    parseCloseAttestationInstruction,
    parseCloseTokenizedAttestationInstruction,
    parseCreateAttestationInstruction,
    parseCreateCredentialInstruction,
    parseCreateSchemaInstruction,
    parseCreateTokenizedAttestationInstruction,
    parseEmitEventInstruction,
    parseTokenizeSchemaInstruction,
    SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS as SAS_PROGRAM_ID,
    SolanaAttestationServiceInstruction,
} from 'sas-lib';

import { toKitInstruction } from '@/app/shared/lib/web3js-compat';
import { BaseTable } from '@/app/shared/ui/Table';

import { Address } from '../../common/Address';
import { mapCodamaIxArgsToRows } from '../codama/codamaUtils';
import { InstructionCard } from '../InstructionCard';

export function isSolanaAttestationInstruction(transactionIx: TransactionInstruction) {
    return transactionIx.programId.toBase58() === SAS_PROGRAM_ID;
}

export function SolanaAttestationDetailsCard({
    ix,
    index,
    result,
    innerCards,
    childIndex,
}: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const kitIx = toKitInstruction(ix);
    const ixType = identifySolanaAttestationServiceInstruction(ix);
    let title = 'Unknown';
    let parsed: any;
    switch (ixType) {
        case SolanaAttestationServiceInstruction.CreateCredential:
            title = 'Create Credential';
            parsed = parseCreateCredentialInstruction(kitIx);
            break;
        case SolanaAttestationServiceInstruction.CreateSchema:
            title = 'Create Schema';
            parsed = parseCreateSchemaInstruction(kitIx);
            break;
        case SolanaAttestationServiceInstruction.ChangeSchemaStatus:
            title = 'Change Schema Status';
            parsed = parseChangeSchemaStatusInstruction(kitIx);
            break;
        case SolanaAttestationServiceInstruction.ChangeAuthorizedSigners:
            title = 'Change Authorized Signers';
            parsed = parseChangeAuthorizedSignersInstruction(kitIx);
            break;
        case SolanaAttestationServiceInstruction.ChangeSchemaDescription:
            title = 'Change Schema Description';
            parsed = parseChangeSchemaDescriptionInstruction(kitIx);
            break;
        case SolanaAttestationServiceInstruction.ChangeSchemaVersion:
            title = 'Change Schema Version';
            parsed = parseChangeSchemaVersionInstruction(kitIx);
            break;
        case SolanaAttestationServiceInstruction.CreateAttestation:
            title = 'Create Attestation';
            parsed = parseCreateAttestationInstruction(kitIx);
            break;
        case SolanaAttestationServiceInstruction.CloseAttestation:
            title = 'Close Attestation';
            parsed = parseCloseAttestationInstruction(kitIx);
            break;
        case SolanaAttestationServiceInstruction.EmitEvent:
            title = 'Emit Event';
            parsed = parseEmitEventInstruction(kitIx);
            break;
        case SolanaAttestationServiceInstruction.TokenizeSchema:
            title = 'Tokenize Schema';
            parsed = parseTokenizeSchemaInstruction(kitIx);
            break;
        case SolanaAttestationServiceInstruction.CreateTokenizedAttestation:
            title = 'Create Tokenized Attestation';
            parsed = parseCreateTokenizedAttestationInstruction(kitIx);
            break;
        case SolanaAttestationServiceInstruction.CloseTokenizedAttestation:
            title = 'Close Tokenized Attestation';
            parsed = parseCloseTokenizedAttestationInstruction(kitIx);
            break;
    }
    return (
        <InstructionCard title={`Solana Attestation: ${title}`} {...{ childIndex, index, innerCards, ix, result }}>
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right" colSpan={2}>
                    <Address pubkey={new PublicKey(SAS_PROGRAM_ID)} alignRight link raw />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row className="e-bg-dark-background e-text-dk-xs e-font-semibold e-uppercase e-tracking-[0.08em] e-text-dark-muted-foreground">
                <BaseTable.Cell>Account Name</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right" colSpan={2}>
                    Address
                </BaseTable.Cell>
            </BaseTable.Row>
            {parsed &&
                parsed.accounts &&
                Object.entries(parsed.accounts as Record<string, AccountMeta>).map(([key, value], idx: number) => (
                    <BaseTable.Row key={idx}>
                        <BaseTable.Cell>{key.charAt(0).toUpperCase() + key.slice(1)}</BaseTable.Cell>
                        <BaseTable.Cell className="e-text-right" colSpan={2}>
                            <Address pubkey={new PublicKey(value.address)} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                ))}

            {/* Need to make sure there's one other field besides the discriminator */}
            {parsed.data && Object.keys(parsed.data).length > 2 && (
                <>
                    <BaseTable.Row className="e-bg-dark-background e-text-dk-xs e-font-semibold e-uppercase e-tracking-[0.08em] e-text-dark-muted-foreground">
                        <BaseTable.Cell>Argument Name</BaseTable.Cell>
                        <BaseTable.Cell>Type</BaseTable.Cell>
                        <BaseTable.Cell className="e-text-right">Value</BaseTable.Cell>
                    </BaseTable.Row>
                    {mapCodamaIxArgsToRows(parsed.data)}
                </>
            )}
        </InstructionCard>
    );
}

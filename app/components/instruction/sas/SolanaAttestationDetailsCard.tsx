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

import { Address } from '../../common/Address';
import { upcastTransactionInstruction } from '../../inspector/into-parsed-data';
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
    const _ix = upcastTransactionInstruction(ix);
    const ixType = identifySolanaAttestationServiceInstruction(ix);
    let title = 'Unknown';
    let parsed: any;
    switch (ixType) {
        case SolanaAttestationServiceInstruction.CreateCredential:
            title = 'Create Credential';
            parsed = parseCreateCredentialInstruction(_ix);
            break;
        case SolanaAttestationServiceInstruction.CreateSchema:
            title = 'Create Schema';
            parsed = parseCreateSchemaInstruction(_ix);
            break;
        case SolanaAttestationServiceInstruction.ChangeSchemaStatus:
            title = 'Change Schema Status';
            parsed = parseChangeSchemaStatusInstruction(_ix);
            break;
        case SolanaAttestationServiceInstruction.ChangeAuthorizedSigners:
            title = 'Change Authorized Signers';
            parsed = parseChangeAuthorizedSignersInstruction(_ix);
            break;
        case SolanaAttestationServiceInstruction.ChangeSchemaDescription:
            title = 'Change Schema Description';
            parsed = parseChangeSchemaDescriptionInstruction(_ix);
            break;
        case SolanaAttestationServiceInstruction.ChangeSchemaVersion:
            title = 'Change Schema Version';
            parsed = parseChangeSchemaVersionInstruction(_ix);
            break;
        case SolanaAttestationServiceInstruction.CreateAttestation:
            title = 'Create Attestation';
            parsed = parseCreateAttestationInstruction(_ix);
            break;
        case SolanaAttestationServiceInstruction.CloseAttestation:
            title = 'Close Attestation';
            parsed = parseCloseAttestationInstruction(_ix);
            break;
        case SolanaAttestationServiceInstruction.EmitEvent:
            title = 'Emit Event';
            parsed = parseEmitEventInstruction(_ix);
            break;
        case SolanaAttestationServiceInstruction.TokenizeSchema:
            title = 'Tokenize Schema';
            parsed = parseTokenizeSchemaInstruction(_ix);
            break;
        case SolanaAttestationServiceInstruction.CreateTokenizedAttestation:
            title = 'Create Tokenized Attestation';
            parsed = parseCreateTokenizedAttestationInstruction(_ix);
            break;
        case SolanaAttestationServiceInstruction.CloseTokenizedAttestation:
            title = 'Close Tokenized Attestation';
            parsed = parseCloseTokenizedAttestationInstruction(_ix);
            break;
    }
    return (
        <InstructionCard title={`Solana Attestation: ${title}`} {...{ childIndex, index, innerCards, ix, result }}>
            <tr>
                <td>Program</td>
                <td className="text-lg-end" colSpan={2}>
                    <Address pubkey={new PublicKey(SAS_PROGRAM_ID)} alignRight link raw />
                </td>
            </tr>
            <tr className="table-sep">
                <td>Account Name</td>
                <td className="text-lg-end" colSpan={2}>
                    Address
                </td>
            </tr>
            {parsed &&
                parsed.accounts &&
                Object.entries(parsed.accounts as Record<string, AccountMeta>).map(([key, value], idx: number) => (
                    <tr key={idx}>
                        <td>{key.charAt(0).toUpperCase() + key.slice(1)}</td>
                        <td className="text-lg-end" colSpan={2}>
                            <Address pubkey={new PublicKey(value.address)} alignRight link />
                        </td>
                    </tr>
                ))}

            {/* Need to make sure there's one other field besides the discriminator */}
            {parsed.data && Object.keys(parsed.data).length > 2 && (
                <>
                    <tr className="table-sep">
                        <td>Argument Name</td>
                        <td>Type</td>
                        <td className="text-lg-end">Value</td>
                    </tr>
                    {mapCodamaIxArgsToRows(parsed.data)}
                </>
            )}
        </InstructionCard>
    );
}

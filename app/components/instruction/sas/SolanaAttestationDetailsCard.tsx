import { DecodedInstructionCard, parseCodamaArgs, useInstructionSurface } from '@entities/instruction-card';
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
} from '@solana/attestation';
import { AccountMeta, isSolanaError } from '@solana/kit';
import { TransactionInstruction } from '@solana/web3.js';

import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { UnknownDetailsCard } from '../UnknownDetailsCard';

export function isSolanaAttestationInstruction(transactionIx: TransactionInstruction) {
    return transactionIx.programId.toBase58() === SAS_PROGRAM_ID;
}

/** Every SAS instruction parses to accounts plus an argument struct; only the struct's shape differs. */
type ParsedSasInstruction = {
    accounts: Record<string, AccountMeta>;
    data: Record<string, unknown>;
};

export function SolanaAttestationDetailsCard({
    ix,
    index,
    innerCards,
    childIndex,
}: {
    ix: TransactionInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { result } = useInstructionSurface();
    const decoded = tryParseSolanaAttestationInstruction(ix);

    if (!decoded) {
        return (
            <UnknownDetailsCard ix={ix} index={index} result={result} innerCards={innerCards} childIndex={childIndex} />
        );
    }

    return (
        <DecodedInstructionCard
            node={{ childIndex, index, innerCards, ix, programId: ix.programId }}
            ix={ix}
            title={`Solana Attestation: ${decoded.name}`}
            accountNames={Object.keys(decoded.parsed.accounts)}
            args={parseCodamaArgs(decoded.parsed.data)}
        />
    );
}

type DecodedSasInstruction = { name: string; parsed: ParsedSasInstruction };

function tryParseSolanaAttestationInstruction(ix: TransactionInstruction): DecodedSasInstruction | undefined {
    try {
        return parseSolanaAttestationInstruction(ix);
    } catch (error) {
        if (isSolanaError(error)) {
            return undefined;
        }
        throw error;
    }
}

function parseSolanaAttestationInstruction(ix: TransactionInstruction): DecodedSasInstruction {
    const kitIx = toKitInstruction(ix);

    switch (identifySolanaAttestationServiceInstruction(ix)) {
        case SolanaAttestationServiceInstruction.CreateCredential:
            return { name: 'Create Credential', parsed: parseCreateCredentialInstruction(kitIx) };
        case SolanaAttestationServiceInstruction.CreateSchema:
            return { name: 'Create Schema', parsed: parseCreateSchemaInstruction(kitIx) };
        case SolanaAttestationServiceInstruction.ChangeSchemaStatus:
            return { name: 'Change Schema Status', parsed: parseChangeSchemaStatusInstruction(kitIx) };
        case SolanaAttestationServiceInstruction.ChangeAuthorizedSigners:
            return { name: 'Change Authorized Signers', parsed: parseChangeAuthorizedSignersInstruction(kitIx) };
        case SolanaAttestationServiceInstruction.ChangeSchemaDescription:
            return { name: 'Change Schema Description', parsed: parseChangeSchemaDescriptionInstruction(kitIx) };
        case SolanaAttestationServiceInstruction.ChangeSchemaVersion:
            return { name: 'Change Schema Version', parsed: parseChangeSchemaVersionInstruction(kitIx) };
        case SolanaAttestationServiceInstruction.CreateAttestation:
            return { name: 'Create Attestation', parsed: parseCreateAttestationInstruction(kitIx) };
        case SolanaAttestationServiceInstruction.CloseAttestation:
            return { name: 'Close Attestation', parsed: parseCloseAttestationInstruction(kitIx) };
        case SolanaAttestationServiceInstruction.EmitEvent:
            return { name: 'Emit Event', parsed: parseEmitEventInstruction(kitIx) };
        case SolanaAttestationServiceInstruction.TokenizeSchema:
            return { name: 'Tokenize Schema', parsed: parseTokenizeSchemaInstruction(kitIx) };
        case SolanaAttestationServiceInstruction.CreateTokenizedAttestation:
            return { name: 'Create Tokenized Attestation', parsed: parseCreateTokenizedAttestationInstruction(kitIx) };
        case SolanaAttestationServiceInstruction.CloseTokenizedAttestation:
            return { name: 'Close Tokenized Attestation', parsed: parseCloseTokenizedAttestationInstruction(kitIx) };
    }
}

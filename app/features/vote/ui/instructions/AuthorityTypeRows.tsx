import type { VoteAuthorityType } from '../../lib/instruction-types';
import { DetailHashRow, DetailRow } from './DetailRow';

export function AuthorityTypeRows({ authorityType }: { authorityType: VoteAuthorityType }) {
    if (typeof authorityType !== 'object') {
        return <DetailRow label="Authority Type">{authorityType}</DetailRow>;
    }

    const { bls_proof_of_possession, bls_pubkey } = authorityType.VoterWithBLS;
    return (
        <>
            <DetailRow label="Authority Type">Voter (BLS)</DetailRow>
            <DetailHashRow label="BLS Pubkey" hash={Buffer.from(bls_pubkey).toString('base64')} />
            <DetailHashRow
                label="BLS Proof of Possession"
                hash={Buffer.from(bls_proof_of_possession).toString('base64')}
            />
        </>
    );
}

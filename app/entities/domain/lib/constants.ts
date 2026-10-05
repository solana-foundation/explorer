import { address } from '@solana/kit';

export const SNS_PARENT_NAME_ACCOUNT = address('58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx');

// stonk•names (stonknames.shop) — a self-owned root under the same program, registered
// independently of SNS/ANS. Derivable as getNameAccountKey(getHashedName('stonk')), no class, no
// parent of its own; included here as a literal address the same way SNS_PARENT_NAME_ACCOUNT is.
export const STONK_PARENT_NAME_ACCOUNT = address('DT1FVreFLAPMRtzd1bcBrp2UpESAfgRvTYSchznXNDer');

export const SPL_NAME_SERVICE_PROGRAM_ADDRESS = address('namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX');

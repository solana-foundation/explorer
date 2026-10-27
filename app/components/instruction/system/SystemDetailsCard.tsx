import { type InstructionNode, UnknownDetailsCard, useInstructionSurface } from '@entities/instruction-card';
import { ParsedInstruction } from '@solana/web3.js';
import { ParsedInfo } from '@validators/index';
import { create } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import { AllocateDetailsCard } from './AllocateDetailsCard';
import { AllocateWithSeedDetailsCard } from './AllocateWithSeedDetailsCard';
import { AssignDetailsCard } from './AssignDetailsCard';
import { AssignWithSeedDetailsCard } from './AssignWithSeedDetailsCard';
import { CreateDetailsCard } from './CreateDetailsCard';
import { CreateWithSeedDetailsCard } from './CreateWithSeedDetailsCard';
import { NonceAdvanceDetailsCard } from './NonceAdvanceDetailsCard';
import { NonceAuthorizeDetailsCard } from './NonceAuthorizeDetailsCard';
import { NonceInitializeDetailsCard } from './NonceInitializeDetailsCard';
import { NonceWithdrawDetailsCard } from './NonceWithdrawDetailsCard';
import { TransferDetailsCard } from './TransferDetailsCard';
import { TransferWithSeedDetailsCard } from './TransferWithSeedDetailsCard';
import {
    AdvanceNonceInfo,
    AllocateInfo,
    AllocateWithSeedInfo,
    AssignInfo,
    AssignWithSeedInfo,
    AuthorizeNonceInfo,
    CreateAccountInfo,
    CreateAccountWithSeedInfo,
    InitializeNonceInfo,
    TransferInfo,
    TransferWithSeedInfo,
    UpgradeNonceInfo,
    WithdrawNonceInfo,
} from './types';
import { UpgradeNonceDetailsCard } from './UpgradeNonceDetailsCard';

type DetailsProps = {
    node: InstructionNode;
    ix: ParsedInstruction;
};

export function SystemDetailsCard({ node, ix }: DetailsProps) {
    const { signature } = useInstructionSurface();

    try {
        const parsed = create(ix.parsed, ParsedInfo);
        switch (parsed.type) {
            case 'createAccount': {
                const info = create(parsed.info, CreateAccountInfo);
                return <CreateDetailsCard info={info} node={node} />;
            }
            case 'createAccountWithSeed': {
                const info = create(parsed.info, CreateAccountWithSeedInfo);
                return <CreateWithSeedDetailsCard info={info} node={node} />;
            }
            case 'allocate': {
                const info = create(parsed.info, AllocateInfo);
                return <AllocateDetailsCard info={info} node={node} />;
            }
            case 'allocateWithSeed': {
                const info = create(parsed.info, AllocateWithSeedInfo);
                return <AllocateWithSeedDetailsCard info={info} node={node} />;
            }
            case 'assign': {
                const info = create(parsed.info, AssignInfo);
                return <AssignDetailsCard info={info} node={node} />;
            }
            case 'assignWithSeed': {
                const info = create(parsed.info, AssignWithSeedInfo);
                return <AssignWithSeedDetailsCard info={info} node={node} />;
            }
            case 'transfer': {
                const info = create(parsed.info, TransferInfo);
                return <TransferDetailsCard info={info} node={node} />;
            }
            case 'advanceNonce': {
                const info = create(parsed.info, AdvanceNonceInfo);
                return <NonceAdvanceDetailsCard info={info} node={node} />;
            }
            case 'withdrawNonce': {
                const info = create(parsed.info, WithdrawNonceInfo);
                return <NonceWithdrawDetailsCard info={info} node={node} />;
            }
            case 'authorizeNonce': {
                const info = create(parsed.info, AuthorizeNonceInfo);
                return <NonceAuthorizeDetailsCard info={info} node={node} />;
            }
            case 'initializeNonce': {
                const info = create(parsed.info, InitializeNonceInfo);
                return <NonceInitializeDetailsCard info={info} node={node} />;
            }
            case 'transferWithSeed': {
                const info = create(parsed.info, TransferWithSeedInfo);
                return <TransferWithSeedDetailsCard info={info} node={node} />;
            }
            case 'upgradeNonce': {
                const info = create(parsed.info, UpgradeNonceInfo);
                return <UpgradeNonceDetailsCard info={info} node={node} />;
            }
            default:
                return <UnknownDetailsCard node={node} />;
        }
    } catch (error) {
        Logger.error(error, { signature });
        return <UnknownDetailsCard node={node} />;
    }
}

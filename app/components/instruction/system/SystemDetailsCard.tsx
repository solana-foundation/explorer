import { type InstructionNode, UnknownDetailsCard } from '@entities/instruction-card';
import { ParsedInfo } from '@validators/index';
import { create } from 'superstruct';

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
    parsed: unknown;
};

export function SystemDetailsCard({ node, parsed }: DetailsProps) {
    const parsedInfo = create(parsed, ParsedInfo);
    switch (parsedInfo.type) {
        case 'createAccount': {
            const info = create(parsedInfo.info, CreateAccountInfo);
            return <CreateDetailsCard info={info} node={node} />;
        }
        case 'createAccountWithSeed': {
            const info = create(parsedInfo.info, CreateAccountWithSeedInfo);
            return <CreateWithSeedDetailsCard info={info} node={node} />;
        }
        case 'allocate': {
            const info = create(parsedInfo.info, AllocateInfo);
            return <AllocateDetailsCard info={info} node={node} />;
        }
        case 'allocateWithSeed': {
            const info = create(parsedInfo.info, AllocateWithSeedInfo);
            return <AllocateWithSeedDetailsCard info={info} node={node} />;
        }
        case 'assign': {
            const info = create(parsedInfo.info, AssignInfo);
            return <AssignDetailsCard info={info} node={node} />;
        }
        case 'assignWithSeed': {
            const info = create(parsedInfo.info, AssignWithSeedInfo);
            return <AssignWithSeedDetailsCard info={info} node={node} />;
        }
        case 'transfer': {
            const info = create(parsedInfo.info, TransferInfo);
            return <TransferDetailsCard info={info} node={node} />;
        }
        case 'advanceNonce': {
            const info = create(parsedInfo.info, AdvanceNonceInfo);
            return <NonceAdvanceDetailsCard info={info} node={node} />;
        }
        case 'withdrawNonce': {
            const info = create(parsedInfo.info, WithdrawNonceInfo);
            return <NonceWithdrawDetailsCard info={info} node={node} />;
        }
        case 'authorizeNonce': {
            const info = create(parsedInfo.info, AuthorizeNonceInfo);
            return <NonceAuthorizeDetailsCard info={info} node={node} />;
        }
        case 'initializeNonce': {
            const info = create(parsedInfo.info, InitializeNonceInfo);
            return <NonceInitializeDetailsCard info={info} node={node} />;
        }
        case 'transferWithSeed': {
            const info = create(parsedInfo.info, TransferWithSeedInfo);
            return <TransferWithSeedDetailsCard info={info} node={node} />;
        }
        case 'upgradeNonce': {
            const info = create(parsedInfo.info, UpgradeNonceInfo);
            return <UpgradeNonceDetailsCard info={info} node={node} />;
        }
        default:
            return <UnknownDetailsCard node={node} />;
    }
}

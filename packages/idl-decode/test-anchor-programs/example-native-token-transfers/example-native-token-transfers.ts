export type ExampleNativeTokenTransfers = {
    version: '3.0.0';
    name: 'example_native_token_transfers';
    instructions: [
        {
            name: 'initialize';
            accounts: [
                {
                    name: 'payer';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'deployer';
                    isMut: false;
                    isSigner: true;
                },
                {
                    name: 'programData';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'config';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'mint';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'rateLimit';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'tokenAuthority';
                    isMut: false;
                    isSigner: false;
                    docs: [
                        'In any case, this function is used to set the Config and initialize the program so we',
                        'assume the caller of this function will have total control over the program.',
                        '',
                        'TODO: Using `UncheckedAccount` here leads to "Access violation in stack frame ...".',
                        'Could refactor code to use `Box<_>` to reduce stack size.',
                    ];
                },
                {
                    name: 'multisigTokenAuthority';
                    isMut: false;
                    isSigner: false;
                    isOptional: true;
                },
                {
                    name: 'custody';
                    isMut: true;
                    isSigner: false;
                    docs: [
                        'The custody account that holds tokens in locking mode and temporarily',
                        'holds tokens in burning mode.',
                        'function if the token account has already been created.',
                    ];
                },
                {
                    name: 'tokenProgram';
                    isMut: false;
                    isSigner: false;
                    docs: ['associated token account for the given mint.'];
                },
                {
                    name: 'associatedTokenProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'bpfLoaderUpgradeableProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [
                {
                    name: 'args';
                    type: {
                        defined: 'InitializeArgs';
                    };
                },
            ];
        },
        {
            name: 'initializeLut';
            accounts: [
                {
                    name: 'payer';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'owner';
                    isMut: false;
                    isSigner: true;
                },
                {
                    name: 'authority';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'lutAddress';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'lut';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'lutProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'entries';
                    accounts: [
                        {
                            name: 'config';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'custody';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'tokenProgram';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'mint';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'tokenAuthority';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'outboxRateLimit';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'wormhole';
                            accounts: [
                                {
                                    name: 'bridge';
                                    isMut: true;
                                    isSigner: false;
                                },
                                {
                                    name: 'feeCollector';
                                    isMut: true;
                                    isSigner: false;
                                },
                                {
                                    name: 'sequence';
                                    isMut: true;
                                    isSigner: false;
                                },
                                {
                                    name: 'program';
                                    isMut: false;
                                    isSigner: false;
                                },
                                {
                                    name: 'systemProgram';
                                    isMut: false;
                                    isSigner: false;
                                },
                                {
                                    name: 'clock';
                                    isMut: false;
                                    isSigner: false;
                                },
                                {
                                    name: 'rent';
                                    isMut: false;
                                    isSigner: false;
                                },
                            ];
                        },
                    ];
                },
            ];
            args: [
                {
                    name: 'recentSlot';
                    type: 'u64';
                },
            ];
        },
        {
            name: 'version';
            accounts: [];
            args: [];
            returns: 'string';
        },
        {
            name: 'transferBurn';
            accounts: [
                {
                    name: 'common';
                    accounts: [
                        {
                            name: 'payer';
                            isMut: true;
                            isSigner: true;
                        },
                        {
                            name: 'config';
                            accounts: [
                                {
                                    name: 'config';
                                    isMut: false;
                                    isSigner: false;
                                },
                            ];
                        },
                        {
                            name: 'mint';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'from';
                            isMut: true;
                            isSigner: false;
                            docs: ['account can spend these tokens.'];
                        },
                        {
                            name: 'tokenProgram';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'outboxItem';
                            isMut: true;
                            isSigner: true;
                        },
                        {
                            name: 'outboxRateLimit';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'custody';
                            isMut: true;
                            isSigner: false;
                            docs: [
                                'Tokens are always transferred to the custody account first regardless of',
                                'the mode.',
                                'For an explanation, see the note in [`transfer_burn`].',
                            ];
                        },
                        {
                            name: 'systemProgram';
                            isMut: false;
                            isSigner: false;
                        },
                    ];
                },
                {
                    name: 'inboxRateLimit';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'peer';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'sessionAuthority';
                    isMut: false;
                    isSigner: false;
                    docs: ['See [`crate::SESSION_AUTHORITY_SEED`] for an explanation of the flow.'];
                },
                {
                    name: 'tokenAuthority';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [
                {
                    name: 'args';
                    type: {
                        defined: 'TransferArgs';
                    };
                },
            ];
        },
        {
            name: 'transferLock';
            accounts: [
                {
                    name: 'common';
                    accounts: [
                        {
                            name: 'payer';
                            isMut: true;
                            isSigner: true;
                        },
                        {
                            name: 'config';
                            accounts: [
                                {
                                    name: 'config';
                                    isMut: false;
                                    isSigner: false;
                                },
                            ];
                        },
                        {
                            name: 'mint';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'from';
                            isMut: true;
                            isSigner: false;
                            docs: ['account can spend these tokens.'];
                        },
                        {
                            name: 'tokenProgram';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'outboxItem';
                            isMut: true;
                            isSigner: true;
                        },
                        {
                            name: 'outboxRateLimit';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'custody';
                            isMut: true;
                            isSigner: false;
                            docs: [
                                'Tokens are always transferred to the custody account first regardless of',
                                'the mode.',
                                'For an explanation, see the note in [`transfer_burn`].',
                            ];
                        },
                        {
                            name: 'systemProgram';
                            isMut: false;
                            isSigner: false;
                        },
                    ];
                },
                {
                    name: 'inboxRateLimit';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'peer';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'sessionAuthority';
                    isMut: false;
                    isSigner: false;
                    docs: ['See [`crate::SESSION_AUTHORITY_SEED`] for an explanation of the flow.'];
                },
            ];
            args: [
                {
                    name: 'args';
                    type: {
                        defined: 'TransferArgs';
                    };
                },
            ];
        },
        {
            name: 'redeem';
            accounts: [
                {
                    name: 'payer';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'config';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'peer';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'transceiverMessage';
                    isMut: false;
                    isSigner: false;
                    docs: ['`Account<T>` and `owner` constraints are mutually-exclusive'];
                },
                {
                    name: 'transceiver';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'mint';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'inboxItem';
                    isMut: true;
                    isSigner: false;
                    docs: [
                        'NOTE: This account is content-addressed (PDA seeded by the message hash).',
                        'This is because in a multi-transceiver configuration, the different',
                        'transceivers "vote" on messages (by delivering them). By making the inbox',
                        "items content-addressed, we can ensure that disagreeing votes don't",
                        'interfere with each other.',
                        'On the first call to [`redeem()`], [`InboxItem`] will be allocated and initialized with',
                        'default values.',
                        'On subsequent calls, we want to modify the `InboxItem` by "voting" on it. Therefore the',
                        'program should not fail which would occur when using the `init` constraint.',
                        'The [`InboxItem::init`] field is used to guard against malicious or accidental modification',
                        'InboxItem fields that should remain constant.',
                    ];
                },
                {
                    name: 'inboxRateLimit';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'outboxRateLimit';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [
                {
                    name: 'args';
                    type: {
                        defined: 'RedeemArgs';
                    };
                },
            ];
        },
        {
            name: 'releaseInboundMint';
            accounts: [
                {
                    name: 'common';
                    accounts: [
                        {
                            name: 'payer';
                            isMut: true;
                            isSigner: true;
                        },
                        {
                            name: 'config';
                            accounts: [
                                {
                                    name: 'config';
                                    isMut: false;
                                    isSigner: false;
                                },
                            ];
                        },
                        {
                            name: 'inboxItem';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'recipient';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'tokenAuthority';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'mint';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'tokenProgram';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'custody';
                            isMut: true;
                            isSigner: false;
                        },
                    ];
                },
                {
                    name: 'multisigTokenAuthority';
                    isMut: false;
                    isSigner: false;
                    isOptional: true;
                },
            ];
            args: [
                {
                    name: 'args';
                    type: {
                        defined: 'ReleaseInboundArgs';
                    };
                },
            ];
        },
        {
            name: 'releaseInboundUnlock';
            accounts: [
                {
                    name: 'common';
                    accounts: [
                        {
                            name: 'payer';
                            isMut: true;
                            isSigner: true;
                        },
                        {
                            name: 'config';
                            accounts: [
                                {
                                    name: 'config';
                                    isMut: false;
                                    isSigner: false;
                                },
                            ];
                        },
                        {
                            name: 'inboxItem';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'recipient';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'tokenAuthority';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'mint';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'tokenProgram';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'custody';
                            isMut: true;
                            isSigner: false;
                        },
                    ];
                },
            ];
            args: [
                {
                    name: 'args';
                    type: {
                        defined: 'ReleaseInboundArgs';
                    };
                },
            ];
        },
        {
            name: 'transferOwnership';
            accounts: [
                {
                    name: 'config';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'owner';
                    isMut: false;
                    isSigner: true;
                },
                {
                    name: 'newOwner';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'upgradeLock';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'programData';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'bpfLoaderUpgradeableProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [];
        },
        {
            name: 'transferOwnershipOneStepUnchecked';
            accounts: [
                {
                    name: 'config';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'owner';
                    isMut: false;
                    isSigner: true;
                },
                {
                    name: 'newOwner';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'upgradeLock';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'programData';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'bpfLoaderUpgradeableProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [];
        },
        {
            name: 'claimOwnership';
            accounts: [
                {
                    name: 'config';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'upgradeLock';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'newOwner';
                    isMut: false;
                    isSigner: true;
                },
                {
                    name: 'programData';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'bpfLoaderUpgradeableProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [];
        },
        {
            name: 'acceptTokenAuthority';
            accounts: [
                {
                    name: 'common';
                    accounts: [
                        {
                            name: 'config';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'mint';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'tokenAuthority';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'multisigTokenAuthority';
                            isMut: false;
                            isSigner: false;
                            isOptional: true;
                        },
                        {
                            name: 'tokenProgram';
                            isMut: false;
                            isSigner: false;
                        },
                    ];
                },
                {
                    name: 'currentAuthority';
                    isMut: false;
                    isSigner: true;
                },
            ];
            args: [];
        },
        {
            name: 'acceptTokenAuthorityFromMultisig';
            accounts: [
                {
                    name: 'common';
                    accounts: [
                        {
                            name: 'config';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'mint';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'tokenAuthority';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'multisigTokenAuthority';
                            isMut: false;
                            isSigner: false;
                            isOptional: true;
                        },
                        {
                            name: 'tokenProgram';
                            isMut: false;
                            isSigner: false;
                        },
                    ];
                },
                {
                    name: 'currentMultisigAuthority';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [];
        },
        {
            name: 'setTokenAuthorityOneStepUnchecked';
            accounts: [
                {
                    name: 'common';
                    accounts: [
                        {
                            name: 'config';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'owner';
                            isMut: false;
                            isSigner: true;
                        },
                        {
                            name: 'mint';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'tokenAuthority';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'multisigTokenAuthority';
                            isMut: false;
                            isSigner: false;
                            isOptional: true;
                        },
                        {
                            name: 'newAuthority';
                            isMut: false;
                            isSigner: false;
                        },
                    ];
                },
                {
                    name: 'tokenProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [];
        },
        {
            name: 'setTokenAuthority';
            accounts: [
                {
                    name: 'common';
                    accounts: [
                        {
                            name: 'config';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'owner';
                            isMut: false;
                            isSigner: true;
                        },
                        {
                            name: 'mint';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'tokenAuthority';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'multisigTokenAuthority';
                            isMut: false;
                            isSigner: false;
                            isOptional: true;
                        },
                        {
                            name: 'newAuthority';
                            isMut: false;
                            isSigner: false;
                        },
                    ];
                },
                {
                    name: 'rentPayer';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'pendingTokenAuthority';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [];
        },
        {
            name: 'revertTokenAuthority';
            accounts: [
                {
                    name: 'common';
                    accounts: [
                        {
                            name: 'config';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'mint';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'tokenAuthority';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'multisigTokenAuthority';
                            isMut: false;
                            isSigner: false;
                            isOptional: true;
                        },
                        {
                            name: 'rentPayer';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'pendingTokenAuthority';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'tokenProgram';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'systemProgram';
                            isMut: false;
                            isSigner: false;
                        },
                    ];
                },
                {
                    name: 'owner';
                    isMut: false;
                    isSigner: true;
                },
            ];
            args: [];
        },
        {
            name: 'claimTokenAuthority';
            accounts: [
                {
                    name: 'common';
                    accounts: [
                        {
                            name: 'config';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'mint';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'tokenAuthority';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'multisigTokenAuthority';
                            isMut: false;
                            isSigner: false;
                            isOptional: true;
                        },
                        {
                            name: 'rentPayer';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'pendingTokenAuthority';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'tokenProgram';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'systemProgram';
                            isMut: false;
                            isSigner: false;
                        },
                    ];
                },
                {
                    name: 'newAuthority';
                    isMut: false;
                    isSigner: true;
                },
            ];
            args: [];
        },
        {
            name: 'claimTokenAuthorityToMultisig';
            accounts: [
                {
                    name: 'common';
                    accounts: [
                        {
                            name: 'config';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'mint';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'tokenAuthority';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'multisigTokenAuthority';
                            isMut: false;
                            isSigner: false;
                            isOptional: true;
                        },
                        {
                            name: 'rentPayer';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'pendingTokenAuthority';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'tokenProgram';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'systemProgram';
                            isMut: false;
                            isSigner: false;
                        },
                    ];
                },
                {
                    name: 'newMultisigAuthority';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [];
        },
        {
            name: 'setPaused';
            accounts: [
                {
                    name: 'owner';
                    isMut: false;
                    isSigner: true;
                },
                {
                    name: 'config';
                    isMut: true;
                    isSigner: false;
                },
            ];
            args: [
                {
                    name: 'pause';
                    type: 'bool';
                },
            ];
        },
        {
            name: 'setPeer';
            accounts: [
                {
                    name: 'payer';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'owner';
                    isMut: false;
                    isSigner: true;
                },
                {
                    name: 'config';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'peer';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'inboxRateLimit';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [
                {
                    name: 'args';
                    type: {
                        defined: 'SetPeerArgs';
                    };
                },
            ];
        },
        {
            name: 'registerTransceiver';
            accounts: [
                {
                    name: 'config';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'owner';
                    isMut: false;
                    isSigner: true;
                },
                {
                    name: 'payer';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'transceiver';
                    isMut: false;
                    isSigner: false;
                    docs: ['used here that wraps the Transceiver account type.'];
                },
                {
                    name: 'registeredTransceiver';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [];
        },
        {
            name: 'deregisterTransceiver';
            accounts: [
                {
                    name: 'config';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'owner';
                    isMut: false;
                    isSigner: true;
                },
                {
                    name: 'registeredTransceiver';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [];
        },
        {
            name: 'setOutboundLimit';
            accounts: [
                {
                    name: 'config';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'owner';
                    isMut: false;
                    isSigner: true;
                },
                {
                    name: 'rateLimit';
                    isMut: true;
                    isSigner: false;
                },
            ];
            args: [
                {
                    name: 'args';
                    type: {
                        defined: 'SetOutboundLimitArgs';
                    };
                },
            ];
        },
        {
            name: 'setInboundLimit';
            accounts: [
                {
                    name: 'config';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'owner';
                    isMut: false;
                    isSigner: true;
                },
                {
                    name: 'rateLimit';
                    isMut: true;
                    isSigner: false;
                },
            ];
            args: [
                {
                    name: 'args';
                    type: {
                        defined: 'SetInboundLimitArgs';
                    };
                },
            ];
        },
        {
            name: 'markOutboxItemAsReleased';
            accounts: [
                {
                    name: 'signer';
                    isMut: false;
                    isSigner: true;
                },
                {
                    name: 'config';
                    accounts: [
                        {
                            name: 'config';
                            isMut: false;
                            isSigner: false;
                        },
                    ];
                },
                {
                    name: 'outboxItem';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'transceiver';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [];
            returns: 'bool';
        },
        {
            name: 'setThreshold';
            accounts: [
                {
                    name: 'owner';
                    isMut: false;
                    isSigner: true;
                },
                {
                    name: 'config';
                    isMut: true;
                    isSigner: false;
                },
            ];
            args: [
                {
                    name: 'threshold';
                    type: 'u8';
                },
            ];
        },
        {
            name: 'setWormholePeer';
            accounts: [
                {
                    name: 'config';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'owner';
                    isMut: false;
                    isSigner: true;
                },
                {
                    name: 'payer';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'peer';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [
                {
                    name: 'args';
                    type: {
                        defined: 'SetTransceiverPeerArgs';
                    };
                },
            ];
        },
        {
            name: 'receiveWormholeMessage';
            accounts: [
                {
                    name: 'payer';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'config';
                    accounts: [
                        {
                            name: 'config';
                            isMut: false;
                            isSigner: false;
                        },
                    ];
                },
                {
                    name: 'peer';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'vaa';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'transceiverMessage';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'systemProgram';
                    isMut: false;
                    isSigner: false;
                },
            ];
            args: [];
        },
        {
            name: 'releaseWormholeOutbound';
            accounts: [
                {
                    name: 'payer';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'config';
                    accounts: [
                        {
                            name: 'config';
                            isMut: false;
                            isSigner: false;
                        },
                    ];
                },
                {
                    name: 'outboxItem';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'transceiver';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'wormholeMessage';
                    isMut: true;
                    isSigner: false;
                },
                {
                    name: 'emitter';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'wormhole';
                    accounts: [
                        {
                            name: 'bridge';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'feeCollector';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'sequence';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'program';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'systemProgram';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'clock';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'rent';
                            isMut: false;
                            isSigner: false;
                        },
                    ];
                },
            ];
            args: [
                {
                    name: 'args';
                    type: {
                        defined: 'ReleaseOutboundArgs';
                    };
                },
            ];
        },
        {
            name: 'broadcastWormholeId';
            accounts: [
                {
                    name: 'payer';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'config';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'mint';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'wormholeMessage';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'emitter';
                    isMut: false;
                    isSigner: false;
                    docs: [
                        'enforced by the [`CpiContext`] call in [`post_message`].',
                        'The seeds constraint ensures that this is the correct address',
                    ];
                },
                {
                    name: 'wormhole';
                    accounts: [
                        {
                            name: 'bridge';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'feeCollector';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'sequence';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'program';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'systemProgram';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'clock';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'rent';
                            isMut: false;
                            isSigner: false;
                        },
                    ];
                },
            ];
            args: [];
        },
        {
            name: 'broadcastWormholePeer';
            accounts: [
                {
                    name: 'payer';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'config';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'peer';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'wormholeMessage';
                    isMut: true;
                    isSigner: true;
                },
                {
                    name: 'emitter';
                    isMut: false;
                    isSigner: false;
                },
                {
                    name: 'wormhole';
                    accounts: [
                        {
                            name: 'bridge';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'feeCollector';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'sequence';
                            isMut: true;
                            isSigner: false;
                        },
                        {
                            name: 'program';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'systemProgram';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'clock';
                            isMut: false;
                            isSigner: false;
                        },
                        {
                            name: 'rent';
                            isMut: false;
                            isSigner: false;
                        },
                    ];
                },
            ];
            args: [
                {
                    name: 'args';
                    type: {
                        defined: 'BroadcastPeerArgs';
                    };
                },
            ];
        },
    ];
    accounts: [
        {
            name: 'config';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'bump';
                        type: 'u8';
                    },
                    {
                        name: 'owner';
                        docs: ['Owner of the program.'];
                        type: 'publicKey';
                    },
                    {
                        name: 'pendingOwner';
                        docs: ['Pending next owner (before claiming ownership).'];
                        type: {
                            option: 'publicKey';
                        };
                    },
                    {
                        name: 'mint';
                        docs: ['Mint address of the token managed by this program.'];
                        type: 'publicKey';
                    },
                    {
                        name: 'tokenProgram';
                        docs: [
                            'Address of the token program (token or token22). This could always be queried',
                            "from the [`mint`] account's owner, but storing it here avoids an indirection",
                            'on the client side.',
                        ];
                        type: 'publicKey';
                    },
                    {
                        name: 'mode';
                        docs: [
                            'The mode that this program is running in. This is used to determine',
                            'whether the program is burning tokens or locking tokens.',
                        ];
                        type: {
                            defined: 'Mode';
                        };
                    },
                    {
                        name: 'chainId';
                        docs: [
                            "The chain id of the chain that this program is running on. We don't",
                            'hardcode this so that the program is deployable on any potential SVM',
                            'forks.',
                        ];
                        type: {
                            defined: 'ChainId';
                        };
                    },
                    {
                        name: 'nextTransceiverId';
                        docs: ['The next transceiver id to use when registering an transceiver.'];
                        type: 'u8';
                    },
                    {
                        name: 'threshold';
                        docs: ['The number of transceivers that must attest to a transfer before it is', 'accepted.'];
                        type: 'u8';
                    },
                    {
                        name: 'enabledTransceivers';
                        docs: [
                            'Bitmap of enabled transceivers.',
                            'The maximum number of transceivers is equal to [`Bitmap::BITS`].',
                        ];
                        type: {
                            defined: 'Bitmap';
                        };
                    },
                    {
                        name: 'paused';
                        docs: ['Pause the program. This is useful for upgrades and other maintenance.'];
                        type: 'bool';
                    },
                    {
                        name: 'custody';
                        docs: ['The custody account that holds tokens in locking mode.'];
                        type: 'publicKey';
                    },
                ];
            };
        },
        {
            name: 'LUT';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'bump';
                        type: 'u8';
                    },
                    {
                        name: 'address';
                        type: 'publicKey';
                    },
                ];
            };
        },
        {
            name: 'nttManagerPeer';
            docs: ['A peer on another chain. Stored in a PDA seeded by the chain id.'];
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'bump';
                        type: 'u8';
                    },
                    {
                        name: 'address';
                        type: {
                            array: ['u8', 32];
                        };
                    },
                    {
                        name: 'tokenDecimals';
                        type: 'u8';
                    },
                ];
            };
        },
        {
            name: 'pendingTokenAuthority';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'bump';
                        type: 'u8';
                    },
                    {
                        name: 'pendingAuthority';
                        type: 'publicKey';
                    },
                    {
                        name: 'rentPayer';
                        type: 'publicKey';
                    },
                ];
            };
        },
        {
            name: 'inboxItem';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'init';
                        type: 'bool';
                    },
                    {
                        name: 'bump';
                        type: 'u8';
                    },
                    {
                        name: 'amount';
                        type: 'u64';
                    },
                    {
                        name: 'recipientAddress';
                        type: 'publicKey';
                    },
                    {
                        name: 'votes';
                        type: {
                            defined: 'Bitmap';
                        };
                    },
                    {
                        name: 'releaseStatus';
                        type: {
                            defined: 'ReleaseStatus';
                        };
                    },
                ];
            };
        },
        {
            name: 'inboxRateLimit';
            docs: [
                'Inbound rate limit per chain.',
                'SECURITY: must check the PDA (since there are multiple PDAs, namely one for each chain.)',
            ];
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'bump';
                        type: 'u8';
                    },
                    {
                        name: 'rateLimit';
                        type: {
                            defined: 'RateLimitState';
                        };
                    },
                ];
            };
        },
        {
            name: 'outboxItem';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'amount';
                        type: {
                            defined: 'TrimmedAmount';
                        };
                    },
                    {
                        name: 'sender';
                        type: 'publicKey';
                    },
                    {
                        name: 'recipientChain';
                        type: {
                            defined: 'ChainId';
                        };
                    },
                    {
                        name: 'recipientNttManager';
                        type: {
                            array: ['u8', 32];
                        };
                    },
                    {
                        name: 'recipientAddress';
                        type: {
                            array: ['u8', 32];
                        };
                    },
                    {
                        name: 'releaseTimestamp';
                        type: 'i64';
                    },
                    {
                        name: 'released';
                        type: {
                            defined: 'Bitmap';
                        };
                    },
                ];
            };
        },
        {
            name: 'outboxRateLimit';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'rateLimit';
                        type: {
                            defined: 'RateLimitState';
                        };
                    },
                ];
            };
        },
        {
            name: 'registeredTransceiver';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'bump';
                        type: 'u8';
                    },
                    {
                        name: 'id';
                        type: 'u8';
                    },
                    {
                        name: 'transceiverAddress';
                        type: 'publicKey';
                    },
                ];
            };
        },
        {
            name: 'transceiverPeer';
            docs: ['A peer on another chain. Stored in a PDA seeded by the chain id.'];
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'bump';
                        type: 'u8';
                    },
                    {
                        name: 'address';
                        type: {
                            array: ['u8', 32];
                        };
                    },
                ];
            };
        },
        {
            name: 'bridgeData';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'guardianSetIndex';
                        docs: ['The current guardian set index, used to decide which signature sets to accept.'];
                        type: 'u32';
                    },
                    {
                        name: 'lastLamports';
                        docs: ['Lamports in the collection account'];
                        type: 'u64';
                    },
                    {
                        name: 'config';
                        docs: ['Bridge configuration, which is set once upon initialization.'];
                        type: {
                            defined: 'BridgeConfig';
                        };
                    },
                ];
            };
        },
    ];
    types: [
        {
            name: 'Bitmap';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'map';
                        type: 'u128';
                    },
                ];
            };
        },
        {
            name: 'SetInboundLimitArgs';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'limit';
                        type: 'u64';
                    },
                    {
                        name: 'chainId';
                        type: {
                            defined: 'ChainId';
                        };
                    },
                ];
            };
        },
        {
            name: 'SetOutboundLimitArgs';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'limit';
                        type: 'u64';
                    },
                ];
            };
        },
        {
            name: 'SetPeerArgs';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'chainId';
                        type: {
                            defined: 'ChainId';
                        };
                    },
                    {
                        name: 'address';
                        type: {
                            array: ['u8', 32];
                        };
                    },
                    {
                        name: 'limit';
                        type: 'u64';
                    },
                    {
                        name: 'tokenDecimals';
                        docs: ['The token decimals on the peer chain.'];
                        type: 'u8';
                    },
                ];
            };
        },
        {
            name: 'InitializeArgs';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'chainId';
                        type: 'u16';
                    },
                    {
                        name: 'limit';
                        type: 'u64';
                    },
                    {
                        name: 'mode';
                        type: {
                            defined: 'Mode';
                        };
                    },
                ];
            };
        },
        {
            name: 'RedeemArgs';
            type: {
                kind: 'struct';
                fields: [];
            };
        },
        {
            name: 'ReleaseInboundArgs';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'revertWhenNotReady';
                        type: 'bool';
                    },
                ];
            };
        },
        {
            name: 'TransferArgs';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'amount';
                        type: 'u64';
                    },
                    {
                        name: 'recipientChain';
                        type: {
                            defined: 'ChainId';
                        };
                    },
                    {
                        name: 'recipientAddress';
                        type: {
                            array: ['u8', 32];
                        };
                    },
                    {
                        name: 'shouldQueue';
                        type: 'bool';
                    },
                ];
            };
        },
        {
            name: 'ReleaseStatus';
            docs: [
                'The status of an InboxItem. This determines whether the tokens are minted/unlocked to the recipient. As',
                'such, this must be used as a state machine that moves forward in a linear manner. A state',
                'should never "move backward" to a previous state (e.g. should never move from `Released` to',
                '`ReleaseAfter`).',
            ];
            type: {
                kind: 'enum';
                variants: [
                    {
                        name: 'NotApproved';
                    },
                    {
                        name: 'ReleaseAfter';
                        fields: ['i64'];
                    },
                    {
                        name: 'Released';
                    },
                ];
            };
        },
        {
            name: 'RateLimitState';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'limit';
                        docs: ['The maximum capacity of the rate limiter.'];
                        type: 'u64';
                    },
                    {
                        name: 'capacityAtLastTx';
                        docs: [
                            'The capacity of the rate limiter at `last_tx_timestamp`.',
                            'The actual current capacity is calculated in `capacity_at`, by',
                            'accounting for the time that has passed since `last_tx_timestamp` and',
                            'the refill rate.',
                        ];
                        type: 'u64';
                    },
                    {
                        name: 'lastTxTimestamp';
                        docs: [
                            'The timestamp of the last transaction that counted towards the current',
                            'capacity. Transactions that exceeded the capacity do not count, they are',
                            'just delayed.',
                        ];
                        type: 'i64';
                    },
                ];
            };
        },
        {
            name: 'SetTransceiverPeerArgs';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'chainId';
                        type: {
                            defined: 'ChainId';
                        };
                    },
                    {
                        name: 'address';
                        type: {
                            array: ['u8', 32];
                        };
                    },
                ];
            };
        },
        {
            name: 'BroadcastPeerArgs';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'chainId';
                        type: 'u16';
                    },
                ];
            };
        },
        {
            name: 'ReleaseOutboundArgs';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'revertOnDelay';
                        type: 'bool';
                    },
                ];
            };
        },
        {
            name: 'ChainId';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'id';
                        type: 'u16';
                    },
                ];
            };
        },
        {
            name: 'Mode';
            type: {
                kind: 'enum';
                variants: [
                    {
                        name: 'Locking';
                    },
                    {
                        name: 'Burning';
                    },
                ];
            };
        },
        {
            name: 'TrimmedAmount';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'amount';
                        type: 'u64';
                    },
                    {
                        name: 'decimals';
                        type: 'u8';
                    },
                ];
            };
        },
        {
            name: 'BridgeConfig';
            type: {
                kind: 'struct';
                fields: [
                    {
                        name: 'guardianSetExpirationTime';
                        docs: [
                            'Period for how long a guardian set is valid after it has been replaced by a new one.  This',
                            'guarantees that VAAs issued by that set can still be submitted for a certain period.  In',
                            'this period we still trust the old guardian set.',
                        ];
                        type: 'u32';
                    },
                    {
                        name: 'fee';
                        docs: ['Amount of lamports that needs to be paid to the protocol to post a message'];
                        type: 'u64';
                    },
                ];
            };
        },
    ];
    errors: [
        {
            code: 6000;
            name: 'CantReleaseYet';
            msg: 'CantReleaseYet';
        },
        {
            code: 6001;
            name: 'InvalidPendingOwner';
            msg: 'InvalidPendingOwner';
        },
        {
            code: 6002;
            name: 'InvalidChainId';
            msg: 'InvalidChainId';
        },
        {
            code: 6003;
            name: 'InvalidRecipientAddress';
            msg: 'InvalidRecipientAddress';
        },
        {
            code: 6004;
            name: 'InvalidTransceiverPeer';
            msg: 'InvalidTransceiverPeer';
        },
        {
            code: 6005;
            name: 'InvalidNttManagerPeer';
            msg: 'InvalidNttManagerPeer';
        },
        {
            code: 6006;
            name: 'InvalidRecipientNttManager';
            msg: 'InvalidRecipientNttManager';
        },
        {
            code: 6007;
            name: 'TransferAlreadyRedeemed';
            msg: 'TransferAlreadyRedeemed';
        },
        {
            code: 6008;
            name: 'TransferCannotBeRedeemed';
            msg: 'TransferCannotBeRedeemed';
        },
        {
            code: 6009;
            name: 'TransferNotApproved';
            msg: 'TransferNotApproved';
        },
        {
            code: 6010;
            name: 'MessageAlreadySent';
            msg: 'MessageAlreadySent';
        },
        {
            code: 6011;
            name: 'InvalidMode';
            msg: 'InvalidMode';
        },
        {
            code: 6012;
            name: 'InvalidMintAuthority';
            msg: 'InvalidMintAuthority';
        },
        {
            code: 6013;
            name: 'TransferExceedsRateLimit';
            msg: 'TransferExceedsRateLimit';
        },
        {
            code: 6014;
            name: 'Paused';
            msg: 'Paused';
        },
        {
            code: 6015;
            name: 'DisabledTransceiver';
            msg: 'DisabledTransceiver';
        },
        {
            code: 6016;
            name: 'InvalidDeployer';
            msg: 'InvalidDeployer';
        },
        {
            code: 6017;
            name: 'BadAmountAfterTransfer';
            msg: 'BadAmountAfterTransfer';
        },
        {
            code: 6018;
            name: 'BadAmountAfterBurn';
            msg: 'BadAmountAfterBurn';
        },
        {
            code: 6019;
            name: 'ZeroThreshold';
            msg: 'ZeroThreshold';
        },
        {
            code: 6020;
            name: 'OverflowExponent';
            msg: 'OverflowExponent';
        },
        {
            code: 6021;
            name: 'OverflowScaledAmount';
            msg: 'OverflowScaledAmount';
        },
        {
            code: 6022;
            name: 'BitmapIndexOutOfBounds';
            msg: 'BitmapIndexOutOfBounds';
        },
        {
            code: 6023;
            name: 'NoRegisteredTransceivers';
            msg: 'NoRegisteredTransceivers';
        },
        {
            code: 6024;
            name: 'NotPaused';
            msg: 'NotPaused';
        },
        {
            code: 6025;
            name: 'InvalidPendingTokenAuthority';
            msg: 'InvalidPendingTokenAuthority';
        },
        {
            code: 6026;
            name: 'IncorrectRentPayer';
            msg: 'IncorrectRentPayer';
        },
        {
            code: 6027;
            name: 'InvalidMultisig';
            msg: 'InvalidMultisig';
        },
        {
            code: 6028;
            name: 'ThresholdTooHigh';
            msg: 'ThresholdTooHigh';
        },
        {
            code: 6029;
            name: 'InvalidTransceiverProgram';
            msg: 'InvalidTransceiverProgram';
        },
    ];
};
export const IDL: ExampleNativeTokenTransfers = {
    version: '3.0.0',
    name: 'example_native_token_transfers',
    instructions: [
        {
            name: 'initialize',
            accounts: [
                {
                    name: 'payer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'deployer',
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: 'programData',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'config',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'mint',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'rateLimit',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'tokenAuthority',
                    isMut: false,
                    isSigner: false,
                    docs: [
                        'In any case, this function is used to set the Config and initialize the program so we',
                        'assume the caller of this function will have total control over the program.',
                        '',
                        'TODO: Using `UncheckedAccount` here leads to "Access violation in stack frame ...".',
                        'Could refactor code to use `Box<_>` to reduce stack size.',
                    ],
                },
                {
                    name: 'multisigTokenAuthority',
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: 'custody',
                    isMut: true,
                    isSigner: false,
                    docs: [
                        'The custody account that holds tokens in locking mode and temporarily',
                        'holds tokens in burning mode.',
                        'function if the token account has already been created.',
                    ],
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                    docs: ['associated token account for the given mint.'],
                },
                {
                    name: 'associatedTokenProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'bpfLoaderUpgradeableProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'args',
                    type: {
                        defined: 'InitializeArgs',
                    },
                },
            ],
        },
        {
            name: 'initializeLut',
            accounts: [
                {
                    name: 'payer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'owner',
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: 'authority',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'lutAddress',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'lut',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'lutProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'entries',
                    accounts: [
                        {
                            name: 'config',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'custody',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'tokenProgram',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'mint',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'tokenAuthority',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'outboxRateLimit',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'wormhole',
                            accounts: [
                                {
                                    name: 'bridge',
                                    isMut: true,
                                    isSigner: false,
                                },
                                {
                                    name: 'feeCollector',
                                    isMut: true,
                                    isSigner: false,
                                },
                                {
                                    name: 'sequence',
                                    isMut: true,
                                    isSigner: false,
                                },
                                {
                                    name: 'program',
                                    isMut: false,
                                    isSigner: false,
                                },
                                {
                                    name: 'systemProgram',
                                    isMut: false,
                                    isSigner: false,
                                },
                                {
                                    name: 'clock',
                                    isMut: false,
                                    isSigner: false,
                                },
                                {
                                    name: 'rent',
                                    isMut: false,
                                    isSigner: false,
                                },
                            ],
                        },
                    ],
                },
            ],
            args: [
                {
                    name: 'recentSlot',
                    type: 'u64',
                },
            ],
        },
        {
            name: 'version',
            accounts: [],
            args: [],
            returns: 'string',
        },
        {
            name: 'transferBurn',
            accounts: [
                {
                    name: 'common',
                    accounts: [
                        {
                            name: 'payer',
                            isMut: true,
                            isSigner: true,
                        },
                        {
                            name: 'config',
                            accounts: [
                                {
                                    name: 'config',
                                    isMut: false,
                                    isSigner: false,
                                },
                            ],
                        },
                        {
                            name: 'mint',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'from',
                            isMut: true,
                            isSigner: false,
                            docs: ['account can spend these tokens.'],
                        },
                        {
                            name: 'tokenProgram',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'outboxItem',
                            isMut: true,
                            isSigner: true,
                        },
                        {
                            name: 'outboxRateLimit',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'custody',
                            isMut: true,
                            isSigner: false,
                            docs: [
                                'Tokens are always transferred to the custody account first regardless of',
                                'the mode.',
                                'For an explanation, see the note in [`transfer_burn`].',
                            ],
                        },
                        {
                            name: 'systemProgram',
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                },
                {
                    name: 'inboxRateLimit',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'peer',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'sessionAuthority',
                    isMut: false,
                    isSigner: false,
                    docs: ['See [`crate::SESSION_AUTHORITY_SEED`] for an explanation of the flow.'],
                },
                {
                    name: 'tokenAuthority',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'args',
                    type: {
                        defined: 'TransferArgs',
                    },
                },
            ],
        },
        {
            name: 'transferLock',
            accounts: [
                {
                    name: 'common',
                    accounts: [
                        {
                            name: 'payer',
                            isMut: true,
                            isSigner: true,
                        },
                        {
                            name: 'config',
                            accounts: [
                                {
                                    name: 'config',
                                    isMut: false,
                                    isSigner: false,
                                },
                            ],
                        },
                        {
                            name: 'mint',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'from',
                            isMut: true,
                            isSigner: false,
                            docs: ['account can spend these tokens.'],
                        },
                        {
                            name: 'tokenProgram',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'outboxItem',
                            isMut: true,
                            isSigner: true,
                        },
                        {
                            name: 'outboxRateLimit',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'custody',
                            isMut: true,
                            isSigner: false,
                            docs: [
                                'Tokens are always transferred to the custody account first regardless of',
                                'the mode.',
                                'For an explanation, see the note in [`transfer_burn`].',
                            ],
                        },
                        {
                            name: 'systemProgram',
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                },
                {
                    name: 'inboxRateLimit',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'peer',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'sessionAuthority',
                    isMut: false,
                    isSigner: false,
                    docs: ['See [`crate::SESSION_AUTHORITY_SEED`] for an explanation of the flow.'],
                },
            ],
            args: [
                {
                    name: 'args',
                    type: {
                        defined: 'TransferArgs',
                    },
                },
            ],
        },
        {
            name: 'redeem',
            accounts: [
                {
                    name: 'payer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'config',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'peer',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'transceiverMessage',
                    isMut: false,
                    isSigner: false,
                    docs: ['`Account<T>` and `owner` constraints are mutually-exclusive'],
                },
                {
                    name: 'transceiver',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'mint',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'inboxItem',
                    isMut: true,
                    isSigner: false,
                    docs: [
                        'NOTE: This account is content-addressed (PDA seeded by the message hash).',
                        'This is because in a multi-transceiver configuration, the different',
                        'transceivers "vote" on messages (by delivering them). By making the inbox',
                        "items content-addressed, we can ensure that disagreeing votes don't",
                        'interfere with each other.',
                        'On the first call to [`redeem()`], [`InboxItem`] will be allocated and initialized with',
                        'default values.',
                        'On subsequent calls, we want to modify the `InboxItem` by "voting" on it. Therefore the',
                        'program should not fail which would occur when using the `init` constraint.',
                        'The [`InboxItem::init`] field is used to guard against malicious or accidental modification',
                        'InboxItem fields that should remain constant.',
                    ],
                },
                {
                    name: 'inboxRateLimit',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'outboxRateLimit',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'args',
                    type: {
                        defined: 'RedeemArgs',
                    },
                },
            ],
        },
        {
            name: 'releaseInboundMint',
            accounts: [
                {
                    name: 'common',
                    accounts: [
                        {
                            name: 'payer',
                            isMut: true,
                            isSigner: true,
                        },
                        {
                            name: 'config',
                            accounts: [
                                {
                                    name: 'config',
                                    isMut: false,
                                    isSigner: false,
                                },
                            ],
                        },
                        {
                            name: 'inboxItem',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'recipient',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'tokenAuthority',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'mint',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'tokenProgram',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'custody',
                            isMut: true,
                            isSigner: false,
                        },
                    ],
                },
                {
                    name: 'multisigTokenAuthority',
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
                },
            ],
            args: [
                {
                    name: 'args',
                    type: {
                        defined: 'ReleaseInboundArgs',
                    },
                },
            ],
        },
        {
            name: 'releaseInboundUnlock',
            accounts: [
                {
                    name: 'common',
                    accounts: [
                        {
                            name: 'payer',
                            isMut: true,
                            isSigner: true,
                        },
                        {
                            name: 'config',
                            accounts: [
                                {
                                    name: 'config',
                                    isMut: false,
                                    isSigner: false,
                                },
                            ],
                        },
                        {
                            name: 'inboxItem',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'recipient',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'tokenAuthority',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'mint',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'tokenProgram',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'custody',
                            isMut: true,
                            isSigner: false,
                        },
                    ],
                },
            ],
            args: [
                {
                    name: 'args',
                    type: {
                        defined: 'ReleaseInboundArgs',
                    },
                },
            ],
        },
        {
            name: 'transferOwnership',
            accounts: [
                {
                    name: 'config',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'owner',
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: 'newOwner',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'upgradeLock',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'programData',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'bpfLoaderUpgradeableProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: 'transferOwnershipOneStepUnchecked',
            accounts: [
                {
                    name: 'config',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'owner',
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: 'newOwner',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'upgradeLock',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'programData',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'bpfLoaderUpgradeableProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: 'claimOwnership',
            accounts: [
                {
                    name: 'config',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'upgradeLock',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'newOwner',
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: 'programData',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'bpfLoaderUpgradeableProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: 'acceptTokenAuthority',
            accounts: [
                {
                    name: 'common',
                    accounts: [
                        {
                            name: 'config',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'mint',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'tokenAuthority',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'multisigTokenAuthority',
                            isMut: false,
                            isSigner: false,
                            isOptional: true,
                        },
                        {
                            name: 'tokenProgram',
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                },
                {
                    name: 'currentAuthority',
                    isMut: false,
                    isSigner: true,
                },
            ],
            args: [],
        },
        {
            name: 'acceptTokenAuthorityFromMultisig',
            accounts: [
                {
                    name: 'common',
                    accounts: [
                        {
                            name: 'config',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'mint',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'tokenAuthority',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'multisigTokenAuthority',
                            isMut: false,
                            isSigner: false,
                            isOptional: true,
                        },
                        {
                            name: 'tokenProgram',
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                },
                {
                    name: 'currentMultisigAuthority',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: 'setTokenAuthorityOneStepUnchecked',
            accounts: [
                {
                    name: 'common',
                    accounts: [
                        {
                            name: 'config',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'owner',
                            isMut: false,
                            isSigner: true,
                        },
                        {
                            name: 'mint',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'tokenAuthority',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'multisigTokenAuthority',
                            isMut: false,
                            isSigner: false,
                            isOptional: true,
                        },
                        {
                            name: 'newAuthority',
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: 'setTokenAuthority',
            accounts: [
                {
                    name: 'common',
                    accounts: [
                        {
                            name: 'config',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'owner',
                            isMut: false,
                            isSigner: true,
                        },
                        {
                            name: 'mint',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'tokenAuthority',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'multisigTokenAuthority',
                            isMut: false,
                            isSigner: false,
                            isOptional: true,
                        },
                        {
                            name: 'newAuthority',
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                },
                {
                    name: 'rentPayer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'pendingTokenAuthority',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: 'revertTokenAuthority',
            accounts: [
                {
                    name: 'common',
                    accounts: [
                        {
                            name: 'config',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'mint',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'tokenAuthority',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'multisigTokenAuthority',
                            isMut: false,
                            isSigner: false,
                            isOptional: true,
                        },
                        {
                            name: 'rentPayer',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'pendingTokenAuthority',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'tokenProgram',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'systemProgram',
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                },
                {
                    name: 'owner',
                    isMut: false,
                    isSigner: true,
                },
            ],
            args: [],
        },
        {
            name: 'claimTokenAuthority',
            accounts: [
                {
                    name: 'common',
                    accounts: [
                        {
                            name: 'config',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'mint',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'tokenAuthority',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'multisigTokenAuthority',
                            isMut: false,
                            isSigner: false,
                            isOptional: true,
                        },
                        {
                            name: 'rentPayer',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'pendingTokenAuthority',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'tokenProgram',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'systemProgram',
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                },
                {
                    name: 'newAuthority',
                    isMut: false,
                    isSigner: true,
                },
            ],
            args: [],
        },
        {
            name: 'claimTokenAuthorityToMultisig',
            accounts: [
                {
                    name: 'common',
                    accounts: [
                        {
                            name: 'config',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'mint',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'tokenAuthority',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'multisigTokenAuthority',
                            isMut: false,
                            isSigner: false,
                            isOptional: true,
                        },
                        {
                            name: 'rentPayer',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'pendingTokenAuthority',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'tokenProgram',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'systemProgram',
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                },
                {
                    name: 'newMultisigAuthority',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: 'setPaused',
            accounts: [
                {
                    name: 'owner',
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: 'config',
                    isMut: true,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'pause',
                    type: 'bool',
                },
            ],
        },
        {
            name: 'setPeer',
            accounts: [
                {
                    name: 'payer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'owner',
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: 'config',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'peer',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'inboxRateLimit',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'args',
                    type: {
                        defined: 'SetPeerArgs',
                    },
                },
            ],
        },
        {
            name: 'registerTransceiver',
            accounts: [
                {
                    name: 'config',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'owner',
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: 'payer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'transceiver',
                    isMut: false,
                    isSigner: false,
                    docs: ['used here that wraps the Transceiver account type.'],
                },
                {
                    name: 'registeredTransceiver',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: 'deregisterTransceiver',
            accounts: [
                {
                    name: 'config',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'owner',
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: 'registeredTransceiver',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: 'setOutboundLimit',
            accounts: [
                {
                    name: 'config',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'owner',
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: 'rateLimit',
                    isMut: true,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'args',
                    type: {
                        defined: 'SetOutboundLimitArgs',
                    },
                },
            ],
        },
        {
            name: 'setInboundLimit',
            accounts: [
                {
                    name: 'config',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'owner',
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: 'rateLimit',
                    isMut: true,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'args',
                    type: {
                        defined: 'SetInboundLimitArgs',
                    },
                },
            ],
        },
        {
            name: 'markOutboxItemAsReleased',
            accounts: [
                {
                    name: 'signer',
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: 'config',
                    accounts: [
                        {
                            name: 'config',
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                },
                {
                    name: 'outboxItem',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'transceiver',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
            returns: 'bool',
        },
        {
            name: 'setThreshold',
            accounts: [
                {
                    name: 'owner',
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: 'config',
                    isMut: true,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'threshold',
                    type: 'u8',
                },
            ],
        },
        {
            name: 'setWormholePeer',
            accounts: [
                {
                    name: 'config',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'owner',
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: 'payer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'peer',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'args',
                    type: {
                        defined: 'SetTransceiverPeerArgs',
                    },
                },
            ],
        },
        {
            name: 'receiveWormholeMessage',
            accounts: [
                {
                    name: 'payer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'config',
                    accounts: [
                        {
                            name: 'config',
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                },
                {
                    name: 'peer',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'vaa',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'transceiverMessage',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: 'releaseWormholeOutbound',
            accounts: [
                {
                    name: 'payer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'config',
                    accounts: [
                        {
                            name: 'config',
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                },
                {
                    name: 'outboxItem',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'transceiver',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'wormholeMessage',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'emitter',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'wormhole',
                    accounts: [
                        {
                            name: 'bridge',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'feeCollector',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'sequence',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'program',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'systemProgram',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'clock',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'rent',
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                },
            ],
            args: [
                {
                    name: 'args',
                    type: {
                        defined: 'ReleaseOutboundArgs',
                    },
                },
            ],
        },
        {
            name: 'broadcastWormholeId',
            accounts: [
                {
                    name: 'payer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'config',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'mint',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'wormholeMessage',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'emitter',
                    isMut: false,
                    isSigner: false,
                    docs: [
                        'enforced by the [`CpiContext`] call in [`post_message`].',
                        'The seeds constraint ensures that this is the correct address',
                    ],
                },
                {
                    name: 'wormhole',
                    accounts: [
                        {
                            name: 'bridge',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'feeCollector',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'sequence',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'program',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'systemProgram',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'clock',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'rent',
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                },
            ],
            args: [],
        },
        {
            name: 'broadcastWormholePeer',
            accounts: [
                {
                    name: 'payer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'config',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'peer',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'wormholeMessage',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'emitter',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'wormhole',
                    accounts: [
                        {
                            name: 'bridge',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'feeCollector',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'sequence',
                            isMut: true,
                            isSigner: false,
                        },
                        {
                            name: 'program',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'systemProgram',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'clock',
                            isMut: false,
                            isSigner: false,
                        },
                        {
                            name: 'rent',
                            isMut: false,
                            isSigner: false,
                        },
                    ],
                },
            ],
            args: [
                {
                    name: 'args',
                    type: {
                        defined: 'BroadcastPeerArgs',
                    },
                },
            ],
        },
    ],
    accounts: [
        {
            name: 'config',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'bump',
                        type: 'u8',
                    },
                    {
                        name: 'owner',
                        docs: ['Owner of the program.'],
                        type: 'publicKey',
                    },
                    {
                        name: 'pendingOwner',
                        docs: ['Pending next owner (before claiming ownership).'],
                        type: {
                            option: 'publicKey',
                        },
                    },
                    {
                        name: 'mint',
                        docs: ['Mint address of the token managed by this program.'],
                        type: 'publicKey',
                    },
                    {
                        name: 'tokenProgram',
                        docs: [
                            'Address of the token program (token or token22). This could always be queried',
                            "from the [`mint`] account's owner, but storing it here avoids an indirection",
                            'on the client side.',
                        ],
                        type: 'publicKey',
                    },
                    {
                        name: 'mode',
                        docs: [
                            'The mode that this program is running in. This is used to determine',
                            'whether the program is burning tokens or locking tokens.',
                        ],
                        type: {
                            defined: 'Mode',
                        },
                    },
                    {
                        name: 'chainId',
                        docs: [
                            "The chain id of the chain that this program is running on. We don't",
                            'hardcode this so that the program is deployable on any potential SVM',
                            'forks.',
                        ],
                        type: {
                            defined: 'ChainId',
                        },
                    },
                    {
                        name: 'nextTransceiverId',
                        docs: ['The next transceiver id to use when registering an transceiver.'],
                        type: 'u8',
                    },
                    {
                        name: 'threshold',
                        docs: ['The number of transceivers that must attest to a transfer before it is', 'accepted.'],
                        type: 'u8',
                    },
                    {
                        name: 'enabledTransceivers',
                        docs: [
                            'Bitmap of enabled transceivers.',
                            'The maximum number of transceivers is equal to [`Bitmap::BITS`].',
                        ],
                        type: {
                            defined: 'Bitmap',
                        },
                    },
                    {
                        name: 'paused',
                        docs: ['Pause the program. This is useful for upgrades and other maintenance.'],
                        type: 'bool',
                    },
                    {
                        name: 'custody',
                        docs: ['The custody account that holds tokens in locking mode.'],
                        type: 'publicKey',
                    },
                ],
            },
        },
        {
            name: 'LUT',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'bump',
                        type: 'u8',
                    },
                    {
                        name: 'address',
                        type: 'publicKey',
                    },
                ],
            },
        },
        {
            name: 'nttManagerPeer',
            docs: ['A peer on another chain. Stored in a PDA seeded by the chain id.'],
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'bump',
                        type: 'u8',
                    },
                    {
                        name: 'address',
                        type: {
                            array: ['u8', 32],
                        },
                    },
                    {
                        name: 'tokenDecimals',
                        type: 'u8',
                    },
                ],
            },
        },
        {
            name: 'pendingTokenAuthority',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'bump',
                        type: 'u8',
                    },
                    {
                        name: 'pendingAuthority',
                        type: 'publicKey',
                    },
                    {
                        name: 'rentPayer',
                        type: 'publicKey',
                    },
                ],
            },
        },
        {
            name: 'inboxItem',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'init',
                        type: 'bool',
                    },
                    {
                        name: 'bump',
                        type: 'u8',
                    },
                    {
                        name: 'amount',
                        type: 'u64',
                    },
                    {
                        name: 'recipientAddress',
                        type: 'publicKey',
                    },
                    {
                        name: 'votes',
                        type: {
                            defined: 'Bitmap',
                        },
                    },
                    {
                        name: 'releaseStatus',
                        type: {
                            defined: 'ReleaseStatus',
                        },
                    },
                ],
            },
        },
        {
            name: 'inboxRateLimit',
            docs: [
                'Inbound rate limit per chain.',
                'SECURITY: must check the PDA (since there are multiple PDAs, namely one for each chain.)',
            ],
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'bump',
                        type: 'u8',
                    },
                    {
                        name: 'rateLimit',
                        type: {
                            defined: 'RateLimitState',
                        },
                    },
                ],
            },
        },
        {
            name: 'outboxItem',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'amount',
                        type: {
                            defined: 'TrimmedAmount',
                        },
                    },
                    {
                        name: 'sender',
                        type: 'publicKey',
                    },
                    {
                        name: 'recipientChain',
                        type: {
                            defined: 'ChainId',
                        },
                    },
                    {
                        name: 'recipientNttManager',
                        type: {
                            array: ['u8', 32],
                        },
                    },
                    {
                        name: 'recipientAddress',
                        type: {
                            array: ['u8', 32],
                        },
                    },
                    {
                        name: 'releaseTimestamp',
                        type: 'i64',
                    },
                    {
                        name: 'released',
                        type: {
                            defined: 'Bitmap',
                        },
                    },
                ],
            },
        },
        {
            name: 'outboxRateLimit',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'rateLimit',
                        type: {
                            defined: 'RateLimitState',
                        },
                    },
                ],
            },
        },
        {
            name: 'registeredTransceiver',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'bump',
                        type: 'u8',
                    },
                    {
                        name: 'id',
                        type: 'u8',
                    },
                    {
                        name: 'transceiverAddress',
                        type: 'publicKey',
                    },
                ],
            },
        },
        {
            name: 'transceiverPeer',
            docs: ['A peer on another chain. Stored in a PDA seeded by the chain id.'],
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'bump',
                        type: 'u8',
                    },
                    {
                        name: 'address',
                        type: {
                            array: ['u8', 32],
                        },
                    },
                ],
            },
        },
        {
            name: 'bridgeData',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'guardianSetIndex',
                        docs: ['The current guardian set index, used to decide which signature sets to accept.'],
                        type: 'u32',
                    },
                    {
                        name: 'lastLamports',
                        docs: ['Lamports in the collection account'],
                        type: 'u64',
                    },
                    {
                        name: 'config',
                        docs: ['Bridge configuration, which is set once upon initialization.'],
                        type: {
                            defined: 'BridgeConfig',
                        },
                    },
                ],
            },
        },
    ],
    types: [
        {
            name: 'Bitmap',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'map',
                        type: 'u128',
                    },
                ],
            },
        },
        {
            name: 'SetInboundLimitArgs',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'limit',
                        type: 'u64',
                    },
                    {
                        name: 'chainId',
                        type: {
                            defined: 'ChainId',
                        },
                    },
                ],
            },
        },
        {
            name: 'SetOutboundLimitArgs',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'limit',
                        type: 'u64',
                    },
                ],
            },
        },
        {
            name: 'SetPeerArgs',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'chainId',
                        type: {
                            defined: 'ChainId',
                        },
                    },
                    {
                        name: 'address',
                        type: {
                            array: ['u8', 32],
                        },
                    },
                    {
                        name: 'limit',
                        type: 'u64',
                    },
                    {
                        name: 'tokenDecimals',
                        docs: ['The token decimals on the peer chain.'],
                        type: 'u8',
                    },
                ],
            },
        },
        {
            name: 'InitializeArgs',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'chainId',
                        type: 'u16',
                    },
                    {
                        name: 'limit',
                        type: 'u64',
                    },
                    {
                        name: 'mode',
                        type: {
                            defined: 'Mode',
                        },
                    },
                ],
            },
        },
        {
            name: 'RedeemArgs',
            type: {
                kind: 'struct',
                fields: [],
            },
        },
        {
            name: 'ReleaseInboundArgs',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'revertWhenNotReady',
                        type: 'bool',
                    },
                ],
            },
        },
        {
            name: 'TransferArgs',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'amount',
                        type: 'u64',
                    },
                    {
                        name: 'recipientChain',
                        type: {
                            defined: 'ChainId',
                        },
                    },
                    {
                        name: 'recipientAddress',
                        type: {
                            array: ['u8', 32],
                        },
                    },
                    {
                        name: 'shouldQueue',
                        type: 'bool',
                    },
                ],
            },
        },
        {
            name: 'ReleaseStatus',
            docs: [
                'The status of an InboxItem. This determines whether the tokens are minted/unlocked to the recipient. As',
                'such, this must be used as a state machine that moves forward in a linear manner. A state',
                'should never "move backward" to a previous state (e.g. should never move from `Released` to',
                '`ReleaseAfter`).',
            ],
            type: {
                kind: 'enum',
                variants: [
                    {
                        name: 'NotApproved',
                    },
                    {
                        name: 'ReleaseAfter',
                        fields: ['i64'],
                    },
                    {
                        name: 'Released',
                    },
                ],
            },
        },
        {
            name: 'RateLimitState',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'limit',
                        docs: ['The maximum capacity of the rate limiter.'],
                        type: 'u64',
                    },
                    {
                        name: 'capacityAtLastTx',
                        docs: [
                            'The capacity of the rate limiter at `last_tx_timestamp`.',
                            'The actual current capacity is calculated in `capacity_at`, by',
                            'accounting for the time that has passed since `last_tx_timestamp` and',
                            'the refill rate.',
                        ],
                        type: 'u64',
                    },
                    {
                        name: 'lastTxTimestamp',
                        docs: [
                            'The timestamp of the last transaction that counted towards the current',
                            'capacity. Transactions that exceeded the capacity do not count, they are',
                            'just delayed.',
                        ],
                        type: 'i64',
                    },
                ],
            },
        },
        {
            name: 'SetTransceiverPeerArgs',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'chainId',
                        type: {
                            defined: 'ChainId',
                        },
                    },
                    {
                        name: 'address',
                        type: {
                            array: ['u8', 32],
                        },
                    },
                ],
            },
        },
        {
            name: 'BroadcastPeerArgs',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'chainId',
                        type: 'u16',
                    },
                ],
            },
        },
        {
            name: 'ReleaseOutboundArgs',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'revertOnDelay',
                        type: 'bool',
                    },
                ],
            },
        },
        {
            name: 'ChainId',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'id',
                        type: 'u16',
                    },
                ],
            },
        },
        {
            name: 'Mode',
            type: {
                kind: 'enum',
                variants: [
                    {
                        name: 'Locking',
                    },
                    {
                        name: 'Burning',
                    },
                ],
            },
        },
        {
            name: 'TrimmedAmount',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'amount',
                        type: 'u64',
                    },
                    {
                        name: 'decimals',
                        type: 'u8',
                    },
                ],
            },
        },
        {
            name: 'BridgeConfig',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'guardianSetExpirationTime',
                        docs: [
                            'Period for how long a guardian set is valid after it has been replaced by a new one.  This',
                            'guarantees that VAAs issued by that set can still be submitted for a certain period.  In',
                            'this period we still trust the old guardian set.',
                        ],
                        type: 'u32',
                    },
                    {
                        name: 'fee',
                        docs: ['Amount of lamports that needs to be paid to the protocol to post a message'],
                        type: 'u64',
                    },
                ],
            },
        },
    ],
    errors: [
        {
            code: 6000,
            name: 'CantReleaseYet',
            msg: 'CantReleaseYet',
        },
        {
            code: 6001,
            name: 'InvalidPendingOwner',
            msg: 'InvalidPendingOwner',
        },
        {
            code: 6002,
            name: 'InvalidChainId',
            msg: 'InvalidChainId',
        },
        {
            code: 6003,
            name: 'InvalidRecipientAddress',
            msg: 'InvalidRecipientAddress',
        },
        {
            code: 6004,
            name: 'InvalidTransceiverPeer',
            msg: 'InvalidTransceiverPeer',
        },
        {
            code: 6005,
            name: 'InvalidNttManagerPeer',
            msg: 'InvalidNttManagerPeer',
        },
        {
            code: 6006,
            name: 'InvalidRecipientNttManager',
            msg: 'InvalidRecipientNttManager',
        },
        {
            code: 6007,
            name: 'TransferAlreadyRedeemed',
            msg: 'TransferAlreadyRedeemed',
        },
        {
            code: 6008,
            name: 'TransferCannotBeRedeemed',
            msg: 'TransferCannotBeRedeemed',
        },
        {
            code: 6009,
            name: 'TransferNotApproved',
            msg: 'TransferNotApproved',
        },
        {
            code: 6010,
            name: 'MessageAlreadySent',
            msg: 'MessageAlreadySent',
        },
        {
            code: 6011,
            name: 'InvalidMode',
            msg: 'InvalidMode',
        },
        {
            code: 6012,
            name: 'InvalidMintAuthority',
            msg: 'InvalidMintAuthority',
        },
        {
            code: 6013,
            name: 'TransferExceedsRateLimit',
            msg: 'TransferExceedsRateLimit',
        },
        {
            code: 6014,
            name: 'Paused',
            msg: 'Paused',
        },
        {
            code: 6015,
            name: 'DisabledTransceiver',
            msg: 'DisabledTransceiver',
        },
        {
            code: 6016,
            name: 'InvalidDeployer',
            msg: 'InvalidDeployer',
        },
        {
            code: 6017,
            name: 'BadAmountAfterTransfer',
            msg: 'BadAmountAfterTransfer',
        },
        {
            code: 6018,
            name: 'BadAmountAfterBurn',
            msg: 'BadAmountAfterBurn',
        },
        {
            code: 6019,
            name: 'ZeroThreshold',
            msg: 'ZeroThreshold',
        },
        {
            code: 6020,
            name: 'OverflowExponent',
            msg: 'OverflowExponent',
        },
        {
            code: 6021,
            name: 'OverflowScaledAmount',
            msg: 'OverflowScaledAmount',
        },
        {
            code: 6022,
            name: 'BitmapIndexOutOfBounds',
            msg: 'BitmapIndexOutOfBounds',
        },
        {
            code: 6023,
            name: 'NoRegisteredTransceivers',
            msg: 'NoRegisteredTransceivers',
        },
        {
            code: 6024,
            name: 'NotPaused',
            msg: 'NotPaused',
        },
        {
            code: 6025,
            name: 'InvalidPendingTokenAuthority',
            msg: 'InvalidPendingTokenAuthority',
        },
        {
            code: 6026,
            name: 'IncorrectRentPayer',
            msg: 'IncorrectRentPayer',
        },
        {
            code: 6027,
            name: 'InvalidMultisig',
            msg: 'InvalidMultisig',
        },
        {
            code: 6028,
            name: 'ThresholdTooHigh',
            msg: 'ThresholdTooHigh',
        },
        {
            code: 6029,
            name: 'InvalidTransceiverProgram',
            msg: 'InvalidTransceiverProgram',
        },
    ],
};

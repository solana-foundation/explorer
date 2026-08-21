/** A block whose only transaction is v1, setting a 10,000 compute unit limit and a 65,536 byte
 *  loaded accounts data size limit in its message config. */
export const V1_BLOCK_RESPONSE = {
    blockTime: 1787266078,
    blockhash: 'SURFNETxSAFEHASHxxxxxxxxxxxxxxxxxxx1a429ax7',
    parentSlot: 440572821,
    previousBlockhash: 'SURFNETxSAFEHASHxxxxxxxxxxxxxxxxxxx1a429ax6',
    rewards: [],
    transactions: [
        {
            meta: {
                computeUnitsConsumed: 150,
                err: null,
                fee: 5000,
                innerInstructions: [],
                loadedAddresses: { readonly: [], writable: [] },
                logMessages: [
                    'Program 11111111111111111111111111111111 invoke [1]',
                    'Program 11111111111111111111111111111111 success',
                ],
                postBalances: [997995000, 2000000, 1],
                postTokenBalances: [],
                preBalances: [1000000000, 0, 1],
                preTokenBalances: [],
            },
            transaction: [
                'gQEAAQwAAAAGhoWdOMgKlyFIGEFpF+C/j8oVfkZPmMz9D4tgIT98jwEDsN70je2SuXm7PnZ9i0Lz/knxA03MHr2RRKYsalX9GoiGHkfgwNARedNTiP/pTTwpIBHdo7ySD6or+jVtd1PgBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAECcAAAAAAQACAgwAAAECAAAAgIQeAAAAAAB5mCptdJ9aqZlgZ4HLuylhytDOdG4PLSd0GkNRDffSvwpTh653j/m23zHKRCHpnRbFc17OUWzwU4Jxs1mCmd0P',
                'base64',
            ],
            version: 1,
        },
    ],
};

/** A block whose only transaction is legacy, which sets no resource limits at all. */
export const LEGACY_BLOCK_RESPONSE = {
    blockTime: 1787266077,
    blockhash: 'SURFNETxSAFEHASHxxxxxxxxxxxxxxxxxxx1a429ax4',
    parentSlot: 440572818,
    previousBlockhash: 'SURFNETxSAFEHASHxxxxxxxxxxxxxxxxxxx1a429ax3',
    rewards: [],
    transactions: [
        {
            meta: {
                computeUnitsConsumed: 150,
                err: null,
                fee: 5000,
                innerInstructions: [],
                loadedAddresses: { readonly: [], writable: [] },
                logMessages: [
                    'Program 11111111111111111111111111111111 invoke [1]',
                    'Program 11111111111111111111111111111111 success',
                ],
                postBalances: [999997999990000, 1000000000, 1],
                postTokenBalances: [],
                preBalances: [999998999995000, 0, 1],
                preTokenBalances: [],
            },
            transaction: [
                'AXrEnD2Oa7boZg7ptqhDNwo2ML+xxeneIfUdQY4MzG7IZyM+2j1dLUsWP+dJqvlLCwmFl7FgStmJ1iGf9NPciAoBAAEDXoh+x6PKPLaf+cYvBMnfGk7xmLPzBQsggSyuASY1XaKw3vSN7ZK5ebs+dn2LQvP+SfEDTcwevZFEpixqVf0aiAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAgIAAQwCAAAAAMqaOwAAAAA=',
                'base64',
            ],
            version: 'legacy',
        },
    ],
};

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';

import { intoParsedTransactionFromMessage } from '../parsed-tx';
// !!!
describe('intoParsedTransactionFromMessage', () => {
    test("should return ParsedTransaction compatible data for SystemProgram::transfer's VersionedMessage", async () => {
        const m = mock.deserializeMessage(stubs.systemTransferMsg);

        const ix = intoParsedTransactionFromMessage(m);
        expect(ix.message.accountKeys).toEqual([]);
        expect(ix.message.addressTableLookups).toHaveLength(0);
        expect(ix.message.recentBlockhash).toEqual('4BbJaBaqatXh5gbRry2yGerZoDm8MP3Tdaw9yVbHSGa3');
        expect(ix.message.instructions).toHaveLength(0);
    });
});

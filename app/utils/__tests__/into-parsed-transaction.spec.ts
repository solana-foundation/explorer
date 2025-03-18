import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { intoTransactionInstructionFromVersionedMessage } from '@/app/components/inspector/utils';

import { intoParsedTransaction } from '../parsed-tx';
import { systemProgramTransactionInstructionParser } from '../parsers';

describe('intoParsedTransaction', () => {
    test("should return ParsedTransaction compatible data for SystemProgram::transfer's VersionedMessage", async () => {
        const m = mock.deserializeMessage(stubs.systemTransferMsg);

        const ix = intoParsedTransaction(m);
        expect(ix).toEqual(1);

    });
});

import { Copyable } from '@/app/components/common/Copyable';

import { NO_SECURITY_TXT_ERROR } from '../lib/constants';

// Card to display empty state and advice to upload security.txt
export function EmptySecurityTxtCard({ programAddress }: { programAddress: string }) {
    const copyableTxt = `npx @solana-program/program-metadata@latest write security ${programAddress} ./security.json`;

    return (
        <div className="card">
            <div className="card-body text-center">
                <div className="mb-4">{NO_SECURITY_TXT_ERROR}</div>

                <div className="mb-4">
                    <p>
                        This program did not provide Security.txt information yet. If you are the maintainer of this
                        program you can use the following command to add your information.
                    </p>
                    <div className="p-2 rounded text-start border d-inline-flex align-items-center text-sm">
                        <Copyable text={copyableTxt}>
                            <code className="font-monospace small text-muted">{copyableTxt}</code>
                        </Copyable>
                    </div>
                </div>
                <div className="text-muted">
                    <a
                        href="https://github.com/solana-program/program-metadata"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary btn-sm"
                    >
                        For further details please follow the documentation
                    </a>
                </div>
            </div>
        </div>
    );
}

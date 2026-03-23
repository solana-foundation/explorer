import { Copy, XCircle } from 'react-feather';

import { useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';

interface IIdlInstructionSectionProps {
    title: string;
    description: string;
    commands: string[];
}

export function IdlInstructionSection({ title, description, commands }: IIdlInstructionSectionProps) {
    const [state, copy] = useCopyToClipboard();

    function handleCopy() {
        copy(commands.join('\n'));
    }

    return (
        <div className="card">
            <div className="card-body e-flex e-items-start e-justify-between e-space-x-2 e-px-3 e-py-2">
                <div>
                    <h5 className="e-mb-1 e-text-sm e-font-semibold">{title}</h5>
                    <p className="e-mb-3 e-text-xs e-text-gray-500">{description}</p>
                    <div>
                        {commands.map((command, index) => (
                            <div key={index} className="e-font-mono e-text-xs">
                                <pre className="e-whitespace-pre-wrap e-bg-transparent e-p-0 e-text-green-400">
                                    <span>&gt; </span>
                                    {command}
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleCopy}
                    type="button"
                    className="btn btn-white btn-sm e-flex-shrink-0"
                    aria-label={state === 'copied' ? 'Copied' : state === 'errored' ? 'Copy failed' : 'Copy'}
                >
                    {state === 'copied' ? (
                        <span className="e-text-green-400">Copied</span>
                    ) : state === 'errored' ? (
                        <span className="e-text-red-400">
                            <XCircle size={16} /> Failed
                        </span>
                    ) : (
                        <>
                            <Copy size={16} /> Copy
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

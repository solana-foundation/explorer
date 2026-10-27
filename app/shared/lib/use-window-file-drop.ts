import 'client-only';

import { useEffect, useEffectEvent, useState } from 'react';

// A file dropped outside a drop target replaces the page, so the hook handles a drop anywhere in the window.
export function useWindowFileDrop(onFile: (file: File | undefined) => void): boolean {
    const [isDragging, setIsDragging] = useState(false);
    const onDropFile = useEffectEvent(onFile);

    useEffect(() => {
        let depth = 0;
        const carriesFiles = (event: DragEvent) => Boolean(event.dataTransfer?.types.includes('Files'));
        const onDragEnter = (event: DragEvent) => {
            if (!carriesFiles(event)) return;
            depth += 1;
            setIsDragging(true);
        };
        const onDragLeave = (event: DragEvent) => {
            if (!carriesFiles(event)) return;
            depth = Math.max(0, depth - 1);
            if (depth === 0) setIsDragging(false);
        };
        const onDragOver = (event: DragEvent) => {
            if (!carriesFiles(event)) return;
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
        };
        const onDrop = (event: DragEvent) => {
            if (!carriesFiles(event)) return;
            event.preventDefault();
            depth = 0;
            setIsDragging(false);
            onDropFile(event.dataTransfer?.files[0]);
        };
        window.addEventListener('dragenter', onDragEnter);
        window.addEventListener('dragleave', onDragLeave);
        window.addEventListener('dragover', onDragOver);
        window.addEventListener('drop', onDrop);
        return () => {
            window.removeEventListener('dragenter', onDragEnter);
            window.removeEventListener('dragleave', onDragLeave);
            window.removeEventListener('dragover', onDragOver);
            window.removeEventListener('drop', onDrop);
        };
    }, []);

    return isDragging;
}

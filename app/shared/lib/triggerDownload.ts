export const triggerDownload = async (data: string, filename: string, type?: string): Promise<void> => {
    const blob = new Blob([Buffer.from(data, 'base64')], type ? { type } : {});
    const fileDownloadUrl = URL.createObjectURL(blob);
    const tempLink = document.createElement('a');
    tempLink.href = fileDownloadUrl;
    tempLink.setAttribute('download', filename);
    tempLink.click();
    URL.revokeObjectURL(fileDownloadUrl);
};

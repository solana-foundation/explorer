// Main fields of Program Metadata security.txt json. May contain additional fields.
// Format: https://github.com/solana-program/program-metadata?tab=readme-ov-file#securitytxt-file-format
export type PmpSecurityTXT = {
    name: string;
    logo: string;
    description: string;
    notification: string;
    sdk: string;
    project_url: string;
    contacts: string[];
    policy: string;
    preferred_languages: string[];
    encryption: string;
    source_code: string;
    source_release: string;
    source_revision: string;
    auditors: string;
    acknowledgements: string;
    expiry: string;
    version: string;
};

export type NeodymeSecurityTXT = {
    name: string;
    project_url: string;
    contacts: string;
    policy: string;
    preferred_languages?: string;
    encryption?: string;
    source_code?: string;
    source_release?: string;
    source_revision?: string;
    auditors?: string;
    acknowledgements?: string;
    expiry?: string;
};

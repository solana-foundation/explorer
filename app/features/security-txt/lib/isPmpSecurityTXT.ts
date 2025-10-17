import type { NeodymeSecurityTXT, PmpSecurityTXT } from './types';

export function isPmpSecurityTXT(securityTxt: NeodymeSecurityTXT | PmpSecurityTXT): securityTxt is PmpSecurityTXT {
    return 'logo' in securityTxt || 'version' in securityTxt;
}

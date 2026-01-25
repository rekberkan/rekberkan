// ============================================================================
// SUPPORTED BANKS CONFIGURATION
// ============================================================================

export const SUPPORTED_BANKS = [
  { code: 'BCA', name: 'Bank Central Asia', logo: '/banks/bca.png' },
  { code: 'BNI', name: 'Bank Negara Indonesia', logo: '/banks/bni.png' },
  { code: 'BRI', name: 'Bank Rakyat Indonesia', logo: '/banks/bri.png' },
  { code: 'MANDIRI', name: 'Bank Mandiri', logo: '/banks/mandiri.png' },
  { code: 'CIMB', name: 'CIMB Niaga', logo: '/banks/cimb.png' },
  { code: 'PERMATA', name: 'Bank Permata', logo: '/banks/permata.png' },
  { code: 'DANAMON', name: 'Bank Danamon', logo: '/banks/danamon.png' },
  { code: 'BSI', name: 'Bank Syariah Indonesia', logo: '/banks/bsi.png' },
  { code: 'BTN', name: 'Bank Tabungan Negara', logo: '/banks/btn.png' },
  { code: 'MEGA', name: 'Bank Mega', logo: '/banks/mega.png' },
] as const;

export const BANK_CODES = SUPPORTED_BANKS.map(b => b.code);

export const getBankByCode = (code: string) => {
  return SUPPORTED_BANKS.find(b => b.code === code.toUpperCase());
};

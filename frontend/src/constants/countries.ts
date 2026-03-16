export interface CountryInfo {
  code: string;
  name: string;
  currency: string;
  currencyName: string;
  flag: string;
}

export const COUNTRY_LIST: CountryInfo[] = [
  { code: 'AU', name: 'Australia',       currency: 'AUD', currencyName: 'Australian Dollar',    flag: '🇦🇺' },
  { code: 'BD', name: 'Bangladesh',      currency: 'BDT', currencyName: 'Bangladeshi Taka',      flag: '🇧🇩' },
  { code: 'BH', name: 'Bahrain',         currency: 'BHD', currencyName: 'Bahraini Dinar',        flag: '🇧🇭' },
  { code: 'CA', name: 'Canada',          currency: 'CAD', currencyName: 'Canadian Dollar',       flag: '🇨🇦' },
  { code: 'CN', name: 'China',           currency: 'CNY', currencyName: 'Chinese Yuan',          flag: '🇨🇳' },
  { code: 'EU', name: 'Europe (EUR)',    currency: 'EUR', currencyName: 'Euro',                  flag: '🇪🇺' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', currencyName: 'British Pound',         flag: '🇬🇧' },
  { code: 'HK', name: 'Hong Kong',      currency: 'HKD', currencyName: 'Hong Kong Dollar',      flag: '🇭🇰' },
  { code: 'ID', name: 'Indonesia',      currency: 'IDR', currencyName: 'Indonesian Rupiah',     flag: '🇮🇩' },
  { code: 'IN', name: 'India',          currency: 'INR', currencyName: 'Indian Rupee',          flag: '🇮🇳' },
  { code: 'JP', name: 'Japan',          currency: 'JPY', currencyName: 'Japanese Yen',          flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea',    currency: 'KRW', currencyName: 'South Korean Won',      flag: '🇰🇷' },
  { code: 'KW', name: 'Kuwait',         currency: 'KWD', currencyName: 'Kuwaiti Dinar',         flag: '🇰🇼' },
  { code: 'LK', name: 'Sri Lanka',      currency: 'LKR', currencyName: 'Sri Lankan Rupee',      flag: '🇱🇰' },
  { code: 'MY', name: 'Malaysia',       currency: 'MYR', currencyName: 'Malaysian Ringgit',     flag: '🇲🇾' },
  { code: 'NP', name: 'Nepal',          currency: 'NPR', currencyName: 'Nepalese Rupee',        flag: '🇳🇵' },
  { code: 'OM', name: 'Oman',           currency: 'OMR', currencyName: 'Omani Rial',            flag: '🇴🇲' },
  { code: 'PH', name: 'Philippines',   currency: 'PHP', currencyName: 'Philippine Peso',       flag: '🇵🇭' },
  { code: 'PK', name: 'Pakistan',      currency: 'PKR', currencyName: 'Pakistani Rupee',       flag: '🇵🇰' },
  { code: 'QA', name: 'Qatar',         currency: 'QAR', currencyName: 'Qatari Riyal',          flag: '🇶🇦' },
  { code: 'SA', name: 'Saudi Arabia',  currency: 'SAR', currencyName: 'Saudi Riyal',           flag: '🇸🇦' },
  { code: 'SG', name: 'Singapore',     currency: 'SGD', currencyName: 'Singapore Dollar',      flag: '🇸🇬' },
  { code: 'TH', name: 'Thailand',      currency: 'THB', currencyName: 'Thai Baht',             flag: '🇹🇭' },
  { code: 'AE', name: 'UAE',           currency: 'AED', currencyName: 'UAE Dirham',            flag: '🇦🇪' },
  { code: 'US', name: 'United States', currency: 'USD', currencyName: 'US Dollar',             flag: '🇺🇸' },
];

export const CURRENCY_LIST = COUNTRY_LIST.map(({ currency, currencyName, flag }) => ({ currency, currencyName, flag }))
  .filter((v, i, arr) => arr.findIndex((x) => x.currency === v.currency) === i)
  .sort((a, b) => a.currency.localeCompare(b.currency));

export function getCountryByCode(code: string): CountryInfo | undefined {
  return COUNTRY_LIST.find((c) => c.code === code);
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'remitter' | 'editor' | 'admin';
  status: 'active' | 'suspended';
  favoriteRemitters: string[];
  createdAt: string;
}

export interface RemitterCountry {
  countryCode: string;
  canSend: boolean;
  canReceive: boolean;
  isActive: boolean;
}

export interface Remitter {
  _id: string;
  userId: User | string;
  companyName: string;
  baseCountry: string;
  supportedCountries: RemitterCountry[];
  email: string;
  phone: string;
  website: string;
  description: string;
  logo: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  createdAt: string;
}

export interface RemittanceRate {
  _id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  unit: number;
  fee: number;
  receivedAmount?: number;
  isFeatured?: boolean;
  remitter: {
    _id: string;
    companyName: string;
    logo: string;
    baseCountry: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BestRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  unit: number;
  remitter: {
    companyName: string;
    logo: string;
  };
  updatedAt: string;
}

export interface Bank {
  _id: string;
  name: string;
  website?: string;
  country?: string;
}

export interface BankInterestRate {
  _id: string;
  bank: Bank | string;
  plan: string;
  duration: string;
  rate: number;
  paymentTerm: string;
  featured: boolean;
}

export interface Blog {
  _id: string;
  title: string;
  thumbnail: string;
  shortDescription: string;
  sourceUrl: string;
  author: { name: string };
  isPublished: boolean;
  createdAt: string;
}

export interface Review {
  _id: string;
  userId: { _id: string; name: string };
  remitterId: { _id: string; companyName: string; logo?: string };
  rating: number;
  text: string;
  transactionDate?: string;
  transactionNumber?: string;
  evidenceUrl?: string;
  isApproved: boolean;
  createdAt: string;
}

export interface Banner {
  _id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  isActive: boolean;
}

export interface Statistics {
  countries: number;
  remitters: number;
  banks: number;
  users: number;
}

export interface ForexRates {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Country {
  _id: string;
  name: string;
  code: string;
  flag?: string;
  currency?: string;
  currencyName?: string;
  isSendCountry: boolean;
  isReceiveCountry: boolean;
  isActive: boolean;
  priority?: number;
}

export interface Partner {
  _id: string;
  name: string;
  sendCountry: Country | string;
  receiveCountry: Country | string;
  logoUrl?: string;
  website?: string;
  description?: string;
  isActive: boolean;
  featured: boolean;
  remitterId?: string;
}

export interface PartnerRoute {
  _id: string;
  sendCountry: Country | string;
  receiveCountry: Country | string;
  partner: Partner | string;
  isActive: boolean;
  createdAt?: string;
}

// Exchange Chart
export interface ExchangeChartCell {
  rate: number;
  unit: number;
  fee: number;
  rateId?: string;
}

export interface ExchangeChartData {
  countries: Country[];
  remitters: { _id: string; companyName: string; logo: string }[];
  matrix: Record<string, Record<string, ExchangeChartCell>>;
}

export interface SnapshotListItem {
  _id: string;
  date: string;
  createdAt: string;
}

export interface SnapshotData {
  date: string;
  countries: Country[];
  remitters: { _id: string; companyName: string; logo: string }[];
  matrix: Record<string, Record<string, ExchangeChartCell>>;
}

// Gallery
export interface GalleryFile {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  createdAt: string;
}

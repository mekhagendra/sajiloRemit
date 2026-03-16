import api from './client';
import type {
  AuthResponse,
  RemittanceRate,
  BestRate,
  Bank,
  BankInterestRate,
  Blog,
  Review,
  User,
  Vendor,
  Statistics,
  ForexRates,
  Banner,
  Country,
  PartnerRoute,
  ExchangeChartData,
  ExchangeChartCell,
  SnapshotListItem,
  SnapshotData,
} from '../types';

// Auth
export const registerUser = (data: { name: string; email: string; password: string }) =>
  api.post<AuthResponse>('/auth/register', data);

export const loginUser = (data: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', data);

export const getMe = () => api.get<{ user: AuthResponse['user'] }>('/auth/me');

export const toggleFavoriteVendor = (vendorId: string) =>
  api.post<{ favoriteVendors: string[] }>(`/auth/favorites/${vendorId}`);

// Rates
export const searchRates = (params: { fromCurrency?: string; toCurrency?: string; amount?: number }) =>
  api.get<{ rates: RemittanceRate[] }>('/rates/search', { params });

export const getBestRates = () => api.get<{ rates: BestRate[] }>('/rates/best');

// Vendors
export const getVendors = (params?: { country?: string }) =>
  api.get<{ vendors: Vendor[] }>('/vendors', { params });

export const getVendorById = (id: string) => api.get<{ vendor: Vendor }>(`/vendors/${id}`);

export const registerVendor = (data: Partial<Vendor>) => api.post<{ vendor: Vendor }>('/vendors', data);

export const getMyVendorProfile = () => api.get<{ vendor: Vendor }>('/vendors/me');
export const updateMyVendorProfile = (data: Partial<Vendor>) => api.put<{ vendor: Vendor }>('/vendors', data);
export const getMyRates = () => api.get<{ rates: RemittanceRate[] }>('/rates/vendor');
export const addRate = (data: { fromCurrency: string; toCurrency: string; rate: number; unit?: number; fee?: number }) =>
  api.post<{ rate: RemittanceRate }>('/rates', data);
export const updateRate = (id: string, data: { rate: number; unit?: number; fee?: number }) =>
  api.put<{ rate: RemittanceRate }>(`/rates/${id}`, data);
export const deleteRate = (id: string) => api.delete(`/rates/${id}`);
export const upsertVendorCountry = (data: { countryCode: string; canSend: boolean; canReceive: boolean }) =>
  api.put<{ vendor: Vendor }>('/vendors/countries/upsert', data);
export const removeVendorCountry = (code: string) => api.delete<{ vendor: Vendor }>(`/vendors/countries/${code}`);

// Bank Rates
export const getBankRates = (params?: { page?: number; limit?: number }) =>
  api.get<{ rates: BankInterestRate[]; total: number; page: number; totalPages: number }>('/bank-rates', { params });

export const getFeaturedBankRates = () =>
  api.get<{ rates: BankInterestRate[] }>('/bank-rates/featured');

// Blogs
export const getBlogs = (params?: { page?: number; limit?: number }) =>
  api.get<{ blogs: Blog[]; total: number; page: number; totalPages: number }>('/blogs', { params });

export const getBlogById = (id: string) => api.get<{ blog: Blog }>(`/blogs/${id}`);

// Reviews
export const getLatestReviews = () => api.get<{ reviews: Review[] }>('/reviews/latest');

export const getVendorReviews = (vendorId: string) =>
  api.get<{ reviews: Review[] }>(`/reviews/vendor/${vendorId}`);

export const createReview = (data: { vendorId: string; rating: number; text: string }) =>
  api.post<{ review: Review }>('/reviews', data);

// Statistics
export const getStatistics = () => api.get<{ statistics: Statistics }>('/statistics');

// Forex
export const getForexRates = (base?: string) =>
  api.get<ForexRates>('/forex', { params: { base } });

// Banners
export const getBanners = (position?: string) =>
  api.get<{ banners: Banner[] }>('/banners', { params: { position } });

// Admin - Banners
export const adminGetBanners = () => api.get<{ banners: Banner[] }>('/banners');
export const adminCreateBanner = (data: { title: string; imageUrl: string; linkUrl?: string; position: string; isActive: boolean }) =>
  api.post<{ banner: Banner }>('/banners', data);
export const adminUpdateBanner = (id: string, data: { title?: string; imageUrl?: string; linkUrl?: string; position?: string; isActive?: boolean }) =>
  api.put<{ banner: Banner }>(`/banners/${id}`, data);
export const adminDeleteBanner = (id: string) => api.delete(`/banners/${id}`);

// Upload
export const adminUploadImage = (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post<{ url: string }>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Admin - Bank Rates
export const adminGetBankRates = (params?: { page?: number; limit?: number }) =>
  api.get<{ rates: BankInterestRate[]; total: number; totalPages: number }>('/bank-rates', { params });
export const adminCreateBankRate = (data: { bank: string; plan: string; duration: string; rate: number; paymentTerm: string }) =>
  api.post<{ rate: BankInterestRate }>('/bank-rates', data);
export const adminUpdateBankRate = (id: string, data: { bank?: string; plan?: string; duration?: string; rate?: number; paymentTerm?: string }) =>
  api.put<{ rate: BankInterestRate }>(`/bank-rates/${id}`, data);
export const adminDeleteBankRate = (id: string) => api.delete(`/bank-rates/${id}`);

// Admin - Banks
export const adminGetBanks = () => api.get<{ banks: Bank[] }>('/banks');
export const adminCreateBank = (data: { name: string; logoUrl?: string; country?: string }) =>
  api.post<{ bank: Bank }>('/banks', data);
export const adminUpdateBank = (id: string, data: { name?: string; logoUrl?: string; country?: string }) =>
  api.put<{ bank: Bank }>(`/banks/${id}`, data);
export const adminDeleteBank = (id: string) => api.delete(`/banks/${id}`);

// Admin
export const adminGetVendors = () => api.get<{ vendors: Vendor[] }>('/admin/vendors');
export const adminUpdateVendorStatus = (id: string, status: string) =>
  api.put(`/admin/vendors/${id}/status`, { status });
export const adminCreateAgent = (data: {
  name: string; email: string; password?: string; companyName: string;
  baseCountry?: string; phone?: string; website?: string; description?: string; logo?: string;
}) => api.post<{ vendor: Vendor; tempPassword?: string }>('/admin/vendors', data);
export const adminGetVendorRates = (vendorId: string) =>
  api.get<{ rates: RemittanceRate[] }>(`/admin/vendors/${vendorId}/rates`);
export const adminCreateRateForVendor = (vendorId: string, data: { fromCurrency: string; toCurrency: string; rate: number; unit?: number; fee?: number }) =>
  api.post<{ rate: RemittanceRate }>(`/admin/vendors/${vendorId}/rates`, data);
export const adminUpdateRateForVendor = (vendorId: string, rateId: string, data: { rate?: number; unit?: number; fee?: number }) =>
  api.put<{ rate: RemittanceRate }>(`/admin/vendors/${vendorId}/rates/${rateId}`, data);
export const adminDeleteRateForVendor = (vendorId: string, rateId: string) =>
  api.delete(`/admin/vendors/${vendorId}/rates/${rateId}`);
export const adminToggleVendorCountry = (vendorId: string, code: string, isActive: boolean) =>
  api.put<{ vendor: Vendor }>(`/admin/vendors/${vendorId}/countries/${code}`, { isActive });

export const adminGetUsers = () => api.get<{ users: User[] }>('/admin/users');
export const adminUpdateUserStatus = (id: string, status: string, suspendReason?: string) =>
  api.put(`/admin/users/${id}/status`, { status, suspendReason });

export const adminGetReviews = () => api.get<{ reviews: Review[] }>('/admin/reviews');
export const adminModerateReview = (id: string, isApproved: boolean) =>
  api.put(`/admin/reviews/${id}`, { isApproved });
export const adminDeleteReview = (id: string) => api.delete(`/admin/reviews/${id}`);

export const adminGetStatistics = () => api.get<{ statistics: Statistics }>('/admin/statistics');

// Admin - Blogs
export const adminGetBlogs = (params?: { page?: number; limit?: number }) =>
  api.get<{ blogs: Blog[]; total: number; totalPages: number }>('/admin/blogs', { params });
export const adminCreateBlog = (data: { title: string; thumbnail?: string; shortDescription: string; content: string; isPublished: boolean }) =>
  api.post<{ blog: Blog }>('/blogs', data);
export const adminUpdateBlog = (id: string, data: { title?: string; thumbnail?: string; shortDescription?: string; content?: string; isPublished?: boolean }) =>
  api.put<{ blog: Blog }>(`/blogs/${id}`, data);
export const adminDeleteBlog = (id: string) => api.delete(`/blogs/${id}`);

// Admin - Countries
export const adminGetCountries = () => api.get<{ countries: Country[] }>('/countries/all');
export const adminCreateCountry = (data: Omit<Country, '_id'>) =>
  api.post<{ country: Country }>('/countries', data);
export const adminUpdateCountry = (id: string, data: Partial<Omit<Country, '_id'>>) =>
  api.put<{ country: Country }>(`/countries/${id}`, data);
export const adminDeleteCountry = (id: string) => api.delete(`/countries/${id}`);

// Admin - Partner Routes (partner details are embedded — no separate partner selection needed)
type PartnerRoutePayload = {
  sendCountry: string;
  receiveCountry: string;
  isActive: boolean;
  name: string;
  logoUrl?: string;
  website?: string;
  description?: string;
  featured?: boolean;
  vendorId?: string;
};
export const adminGetPartnerRoutes = () => api.get<{ routes: PartnerRoute[] }>('/partner-routes/all');
export const adminCreatePartnerRoute = (data: PartnerRoutePayload) =>
  api.post<{ route: PartnerRoute }>('/partner-routes', data);
export const adminUpdatePartnerRoute = (id: string, data: Partial<PartnerRoutePayload>) =>
  api.put<{ route: PartnerRoute }>(`/partner-routes/${id}`, data);
export const adminDeletePartnerRoute = (id: string) => api.delete(`/partner-routes/${id}`);

// Admin - Exchange Chart
export const adminGetExchangeChart = () =>
  api.get<ExchangeChartData>('/exchange-chart');
export const adminUpdateChartRate = (data: {
  vendorId: string; fromCurrency: string; toCurrency: string;
  rate: number; unit?: number; fee?: number;
}) => api.put<{ rate: RemittanceRate; cell: ExchangeChartCell }>('/exchange-chart/rate', data);
export const adminTakeSnapshot = () =>
  api.post<{ message: string; date: string; rateCount: number }>('/exchange-chart/snapshot');
export const adminListSnapshots = (params?: { page?: number; limit?: number }) =>
  api.get<{ snapshots: SnapshotListItem[]; total: number; page: number; totalPages: number }>('/exchange-chart/snapshots', { params });
export const adminGetSnapshot = (date: string) =>
  api.get<SnapshotData>(`/exchange-chart/snapshot/${date}`);

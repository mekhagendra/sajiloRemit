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
  Remitter,
  Statistics,
  ForexRates,
  Banner,
  Country,
  PartnerRoute,
  ExchangeChartData,
  ExchangeChartCell,
  SnapshotListItem,
  SnapshotData,
  GalleryFile,
} from '../types';

// Auth
export const registerUser = (data: { name: string; email: string; password: string }) =>
  api.post<AuthResponse>('/auth/register', data);

export const loginUser = (data: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', data);

export const getMe = () => api.get<{ user: AuthResponse['user'] }>('/auth/me');

export const updateProfile = (data: { name: string }) =>
  api.put<{ user: User }>('/auth/profile', data);

export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  api.put<{ message: string }>('/auth/password', data);

export const toggleFavoriteRemitter = (remitterId: string) =>
  api.post<{ favoriteRemitters: string[] }>(`/auth/favorites/${remitterId}`);

// Rates
export const searchRates = (params: { fromCurrency?: string; toCurrency?: string; amount?: number }) =>
  api.get<{ rates: RemittanceRate[] }>('/rates/search', { params });

export const getBestRates = () => api.get<{ rates: BestRate[] }>('/rates/best');

// Remitters
export const getRemitters = (params?: { country?: string }) =>
  api.get<{ remitters: Remitter[] }>('/remitters', { params });

export const getRemitterById = (id: string) => api.get<{ remitter: Remitter }>(`/remitters/${id}`);

export const registerRemitter = (data: Partial<Remitter>) => api.post<{ remitter: Remitter }>('/remitters', data);

export const getMyRemitterProfile = () => api.get<{ remitter: Remitter }>('/remitters/me');
export const updateMyRemitterProfile = (data: Partial<Remitter>) => api.put<{ remitter: Remitter }>('/remitters', data);
export const getMyRates = () => api.get<{ rates: RemittanceRate[] }>('/rates/remitter');
export const addRate = (data: { fromCurrency: string; toCurrency: string; rate: number; unit?: number; fee?: number }) =>
  api.post<{ rate: RemittanceRate }>('/rates', data);
export const updateRate = (id: string, data: { rate: number; unit?: number; fee?: number }) =>
  api.put<{ rate: RemittanceRate }>(`/rates/${id}`, data);
export const deleteRate = (id: string) => api.delete(`/rates/${id}`);
export const upsertRemitterCountry = (data: { countryCode: string; canSend: boolean; canReceive: boolean }) =>
  api.put<{ remitter: Remitter }>('/remitters/countries/upsert', data);
export const removeRemitterCountry = (code: string) => api.delete<{ remitter: Remitter }>(`/remitters/countries/${code}`);

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

export const getRemitterReviews = (remitterId: string) =>
  api.get<{ reviews: Review[] }>(`/reviews/remitter/${remitterId}`);

export const createReview = (data: { remitterId: string; rating: number; text: string }) =>
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
export const adminGetRemitters = () => api.get<{ remitters: Remitter[] }>('/admin/remitters');
export const adminUpdateRemitterStatus = (id: string, status: string) =>
  api.put(`/admin/remitters/${id}/status`, { status });
export const adminCreateRemitter = (data: {
  name: string; email: string; password?: string; companyName: string;
  baseCountry?: string; phone?: string; website?: string; description?: string; logo?: string;
}) => api.post<{ remitter: Remitter; tempPassword?: string }>('/admin/remitters', data);
export const adminGetRemitterRates = (remitterId: string) =>
  api.get<{ rates: RemittanceRate[] }>(`/admin/remitters/${remitterId}/rates`);
export const adminCreateRateForRemitter = (remitterId: string, data: { fromCurrency: string; toCurrency: string; rate: number; unit?: number; fee?: number }) =>
  api.post<{ rate: RemittanceRate }>(`/admin/remitters/${remitterId}/rates`, data);
export const adminUpdateRateForRemitter = (remitterId: string, rateId: string, data: { rate?: number; unit?: number; fee?: number }) =>
  api.put<{ rate: RemittanceRate }>(`/admin/remitters/${remitterId}/rates/${rateId}`, data);
export const adminDeleteRateForRemitter = (remitterId: string, rateId: string) =>
  api.delete(`/admin/remitters/${remitterId}/rates/${rateId}`);
export const adminToggleRemitterCountry = (remitterId: string, code: string, isActive: boolean) =>
  api.put<{ remitter: Remitter }>(`/admin/remitters/${remitterId}/countries/${code}`, { isActive });

export const adminGetUsers = () => api.get<{ users: User[] }>('/admin/users');
export const adminUpdateUserStatus = (id: string, status: string, suspendReason?: string) =>
  api.put(`/admin/users/${id}/status`, { status, suspendReason });

// Admin - Editors
export const adminGetEditors = () => api.get<{ editors: User[] }>('/admin/editors');
export const adminCreateEditor = (data: { name: string; email: string; password: string }) =>
  api.post<{ editor: User }>('/admin/editors', data);
export const adminUpdateEditor = (id: string, data: { name?: string; password?: string; status?: string }) =>
  api.put<{ editor: User }>(`/admin/editors/${id}`, data);
export const adminDeleteEditor = (id: string) => api.delete(`/admin/editors/${id}`);

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
  name?: string;
  logoUrl?: string;
  website?: string;
  description?: string;
  featured?: boolean;
  remitterId?: string;
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
  remitterId: string; fromCurrency: string; toCurrency: string;
  rate: number; unit?: number; fee?: number;
}) => api.put<{ rate: RemittanceRate; cell: ExchangeChartCell }>('/exchange-chart/rate', data);
export const adminTakeSnapshot = () =>
  api.post<{ message: string; date: string; rateCount: number }>('/exchange-chart/snapshot');
export const adminListSnapshots = (params?: { page?: number; limit?: number }) =>
  api.get<{ snapshots: SnapshotListItem[]; total: number; page: number; totalPages: number }>('/exchange-chart/snapshots', { params });
export const adminGetSnapshot = (date: string) =>
  api.get<SnapshotData>(`/exchange-chart/snapshot/${date}`);

// Admin - Gallery
export const adminListGallery = (params?: { page?: number; limit?: number; search?: string }) =>
  api.get<{ files: GalleryFile[]; total: number; page: number; totalPages: number }>('/gallery', { params });
export const adminUploadToGallery = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<{ file: GalleryFile }>('/gallery/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const adminDeleteGalleryFile = (id: string) => api.delete(`/gallery/${id}`);

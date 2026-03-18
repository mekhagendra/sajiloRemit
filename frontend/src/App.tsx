import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { lazy, Suspense } from 'react';
import Layout from './components/layout/Layout';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/admin/ProtectedRoute';

// Public pages — statically imported (fast initial load)
import HomePage from './pages/HomePage';
import BestRatesPage from './pages/BestRatesPage';
import ForexPage from './pages/ForexPage';
import RemittersPage from './pages/RemittersPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BankRatesPage from './pages/BankRatesPage';
import BlogsPage from './pages/BlogsPage';

import RemitterRegisterPage from './pages/RemitterRegisterPage';
import RemitterDashboard from './pages/RemitterDashboard';
import EditorProfile from './pages/admin/EditorProfile';
import MyReviewsPage from './pages/MyReviewsPage';

// Admin pages — lazily loaded (only fetched when an admin visits)
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminRemitters    = lazy(() => import('./pages/admin/AdminRemitters'));
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers'));
const AdminReviews      = lazy(() => import('./pages/admin/AdminReviews'));
const AdminBankRates    = lazy(() => import('./pages/admin/AdminBankRates'));
const AdminBanks        = lazy(() => import('./pages/admin/AdminBanks'));
const AdminBanners      = lazy(() => import('./pages/admin/AdminBanners'));
const AdminBlogs        = lazy(() => import('./pages/admin/AdminBlogs'));
const AdminCountries    = lazy(() => import('./pages/admin/AdminCountries'));
const AdminPartnerRoutes = lazy(() => import('./pages/admin/AdminPartnerRoutes'));
const AdminExchangeChart = lazy(() => import('./pages/admin/AdminExchangeChart'));
const AdminGallery      = lazy(() => import('./pages/admin/AdminGallery'));
const AdminEditors      = lazy(() => import('./pages/admin/AdminEditors'));

function AdminFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-600 border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="best-rates" element={<BestRatesPage />} />
            <Route path="forex" element={<ForexPage />} />
            <Route path="remitters" element={<RemittersPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="privacy" element={<PrivacyPolicyPage />} />
            <Route path="terms" element={<TermsOfServicePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="bank-rates" element={<BankRatesPage />} />
            <Route path="blogs" element={<BlogsPage />} />

            <Route path="join-us" element={<RemitterRegisterPage />} />
            <Route path="remitter/dashboard" element={<RemitterDashboard />} />
            <Route path="my-reviews" element={<MyReviewsPage />} />
            <Route path="profile" element={<EditorProfile />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Suspense fallback={<AdminFallback />}><AdminDashboard /></Suspense>} />
            <Route path="remitters" element={<Suspense fallback={<AdminFallback />}><AdminRemitters /></Suspense>} />
            <Route path="users" element={<Suspense fallback={<AdminFallback />}><AdminUsers /></Suspense>} />
            <Route path="reviews" element={<Suspense fallback={<AdminFallback />}><AdminReviews /></Suspense>} />
            <Route path="banks" element={<Suspense fallback={<AdminFallback />}><AdminBanks /></Suspense>} />
            <Route path="bank-rates" element={<Suspense fallback={<AdminFallback />}><AdminBankRates /></Suspense>} />
            <Route path="blogs" element={<Suspense fallback={<AdminFallback />}><AdminBlogs /></Suspense>} />
            <Route path="banners" element={<Suspense fallback={<AdminFallback />}><AdminBanners /></Suspense>} />
            <Route path="countries" element={<Suspense fallback={<AdminFallback />}><AdminCountries /></Suspense>} />
            <Route path="partner-routes" element={<Suspense fallback={<AdminFallback />}><AdminPartnerRoutes /></Suspense>} />
            <Route path="exchange-chart" element={<Suspense fallback={<AdminFallback />}><AdminExchangeChart /></Suspense>} />
            <Route path="gallery" element={<Suspense fallback={<AdminFallback />}><AdminGallery /></Suspense>} />
            <Route path="profile" element={<Suspense fallback={<AdminFallback />}><EditorProfile /></Suspense>} />
            <Route path="editors" element={<Suspense fallback={<AdminFallback />}><AdminEditors /></Suspense>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

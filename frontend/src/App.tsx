import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/admin/ProtectedRoute';
import HomePage from './pages/HomePage';
import BestRatesPage from './pages/BestRatesPage';
import ForexPage from './pages/ForexPage';
import RemittersPage from './pages/RemittersPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BankRatesPage from './pages/BankRatesPage';
import BlogsPage from './pages/BlogsPage';
import BlogDetailPage from './pages/BlogDetailPage';
import RemitterRegisterPage from './pages/RemitterRegisterPage';
import RemitterDashboard from './pages/RemitterDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRemitters from './pages/admin/AdminRemitters';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReviews from './pages/admin/AdminReviews';
import AdminBankRates from './pages/admin/AdminBankRates';
import AdminBanks from './pages/admin/AdminBanks';
import AdminBanners from './pages/admin/AdminBanners';
import AdminBlogs from './pages/admin/AdminBlogs';
import AdminCountries from './pages/admin/AdminCountries';
import AdminPartnerRoutes from './pages/admin/AdminPartnerRoutes';
import AdminExchangeChart from './pages/admin/AdminExchangeChart';
import AdminGallery from './pages/admin/AdminGallery';
import EditorProfile from './pages/admin/EditorProfile';
import AdminEditors from './pages/admin/AdminEditors';

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
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="bank-rates" element={<BankRatesPage />} />
            <Route path="blogs" element={<BlogsPage />} />
            <Route path="blogs/:id" element={<BlogDetailPage />} />
            <Route path="join-us" element={<RemitterRegisterPage />} />
            <Route path="remitter/dashboard" element={<RemitterDashboard />} />
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
            <Route index element={<AdminDashboard />} />
            <Route path="remitters" element={<AdminRemitters />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="banks" element={<AdminBanks />} />
            <Route path="bank-rates" element={<AdminBankRates />} />
            <Route path="blogs" element={<AdminBlogs />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="countries" element={<AdminCountries />} />
            <Route path="partner-routes" element={<AdminPartnerRoutes />} />
            <Route path="exchange-chart" element={<AdminExchangeChart />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="profile" element={<EditorProfile />} />
            <Route path="editors" element={<AdminEditors />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

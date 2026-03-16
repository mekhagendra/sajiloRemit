import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import BannerAd from '../common/BannerAd';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BannerAd position="above_navbar" />
        </div>
      </div>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

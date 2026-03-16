import HeroSection from '../components/home/HeroSection';
import BlogSection from '../components/home/BlogSection';
import BestRateSidebar from '../components/home/BestRateSidebar';
import BankInterestTable from '../components/home/BankInterestTable';
import ReviewsSidebar from '../components/home/ReviewsSidebar';
import StatisticsSection from '../components/home/StatisticsSection';
import BannerAd from '../components/common/BannerAd';

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BannerAd position="below_hero" />
        </div>
      </section>

      {/* Blog + Best Rate Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <BlogSection />
            </div>
            <div>
              <BestRateSidebar />
            </div>
          </div>
        </div>
      </section>
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BannerAd position="below_best_rate" />
        </div>
      </section>

      {/* Bank Interest + Reviews Sidebar */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <BankInterestTable />
            </div>
            <div>
              <ReviewsSidebar />
            </div>
          </div>
        </div>
      </section>
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BannerAd position="below_bank_interest" />
        </div>
      </section>

      <StatisticsSection />
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BannerAd position="below_statistics" />
        </div>
      </section>
    </div>
  );
}

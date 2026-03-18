import { Users, Globe, Shield, TrendingUp } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-green-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">About SajiloRemit</h1>
          <p className="text-lg text-green-100">
            Helping Nepali diaspora find the best remittance rates — transparently and effortlessly.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Mission</h2>
        <p className="text-gray-600 leading-relaxed">
          SajiloRemit is a remittance comparison platform that empowers users to compare
          exchange rates across multiple remittance providers in real time. Our goal is to
          bring transparency to the remittance industry, so that every dollar you send home
          reaches your loved ones at the best possible rate.
        </p>
      </section>

      {/* Values */}
      <section className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">What We Stand For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Transparency</h3>
                <p className="text-sm text-gray-600">We show real rates from verified providers with no hidden fees.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Best Rates</h3>
                <p className="text-sm text-gray-600">Compare rates side by side and pick the provider that saves you the most.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Community First</h3>
                <p className="text-sm text-gray-600">Built by the Nepali community, for the Nepali community worldwide.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">User-Driven</h3>
                <p className="text-sm text-gray-600">Reviews and ratings from real users help you make informed decisions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Select Country', desc: 'Choose the country you are sending money from.' },
            { step: '2', title: 'Compare Rates', desc: 'View live exchange rates from multiple remittance providers.' },
            { step: '3', title: 'Send Money', desc: 'Pick the best rate and send money through the provider of your choice.' },
          ].map((item) => (
            <div key={item.step} className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

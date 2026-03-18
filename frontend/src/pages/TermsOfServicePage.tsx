export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Terms of Service</h1>

        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6 text-gray-600 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing and using SajiloRemit, you agree to be bound by these Terms of Service.
              If you do not agree with any part of these terms, you should not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">2. Description of Service</h2>
            <p>
              SajiloRemit is a remittance rate comparison platform. We aggregate and display exchange
              rates from various remittance providers to help users compare and find the best rates
              for sending money to Nepal. We do not process any money transfers directly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">3. User Accounts</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You agree to provide accurate and complete information when creating an account</li>
              <li>You are responsible for all activities that occur under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">4. Accuracy of Information</h2>
            <p>
              While we strive to provide accurate and up-to-date exchange rate information,
              rates are sourced from third-party providers and may change without notice.
              SajiloRemit does not guarantee the accuracy of any rate displayed on the platform.
              Always verify the final rate with your chosen provider before making a transfer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">5. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Use the platform for any unlawful purpose</li>
              <li>Submit false or misleading reviews</li>
              <li>Attempt to interfere with the platform's operation</li>
              <li>Scrape or harvest data from the platform without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">6. Limitation of Liability</h2>
            <p>
              SajiloRemit is provided "as is" without warranties of any kind. We shall not be
              liable for any losses arising from your use of the platform or reliance on the
              exchange rate information displayed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">7. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the platform
              after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">8. Contact</h2>
            <p>
              For questions regarding these Terms of Service, please visit our{' '}
              <a href="/contact" className="text-green-600 hover:underline">Contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

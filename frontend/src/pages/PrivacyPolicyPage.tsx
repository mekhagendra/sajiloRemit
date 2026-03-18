export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Privacy Policy</h1>

        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6 text-gray-600 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">1. Information We Collect</h2>
            <p>
              We collect personal information you voluntarily provide when you register an account,
              submit reviews, or contact us. This may include your name, email address, and any
              other information you choose to share.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>To provide, operate, and maintain the SajiloRemit platform</li>
              <li>To improve and personalize your experience</li>
              <li>To communicate with you regarding updates and support</li>
              <li>To display exchange rate comparisons and provider information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">3. Data Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties.
              We may share information with trusted service providers who help us operate
              the platform, subject to confidentiality obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">4. Cookies</h2>
            <p>
              We use cookies and similar technologies to enhance your browsing experience,
              analyze site traffic, and understand user preferences. You can manage cookie
              settings through your browser.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">5. Data Security</h2>
            <p>
              We implement reasonable security measures to protect your personal information.
              However, no method of transmission over the internet is 100% secure, and we
              cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">6. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data at any time
              by contacting us or through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through
              our <a href="/contact" className="text-green-600 hover:underline">Contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

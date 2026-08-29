import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-12 text-gray-800">
        <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>

        <p className="text-gray-600 mb-10">
          <strong>Effective Date: August 29, 2026</strong>
        </p>

        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-3">
              1. Information We Collect
            </h2>

            <p className="mb-3">
              We may collect information you provide directly to us, including:
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>Name and contact information</li>
              <li>Account and order information</li>
              <li>Information you provide through MindMirror3D assessments</li>
              <li>Results generated from those assessments</li>
              <li>Communications you send to us</li>
            </ul>

            <p className="mt-3">
              We may also collect technical information when you use our website,
              such as IP address, browser or device information, cookies, and pages
              visited.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">
              2. How We Use Information
            </h2>

            <p className="mb-3">We may use information to:</p>

            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and personalize MindMirror3D products and services</li>
              <li>Generate personalized sculptures and related materials</li>
              <li>Process orders and payments</li>
              <li>Operate, maintain, and secure the website</li>
              <li>Communicate with customers</li>
              <li>Improve our products and services</li>
              <li>Measure the effectiveness of advertising</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">
              3. Assessment Information
            </h2>

            <p className="mb-3">
              MindMirror3D uses assessment information to provide personalized
              products and experiences.
            </p>

            <p>
              We do not intentionally use assessment responses or derived
              personality and self-discovery results for third-party advertising
              purposes.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">
              4. Advertising and Tracking Technologies
            </h2>

            <p className="mb-3">
              We may use third-party advertising and measurement technologies,
              including tools provided by Meta Platforms, Inc., on certain public
              areas of our website.
            </p>

            <p className="mb-3">
              These technologies may collect information such as pages visited,
              page URLs, IP address, browser or device information, cookies, or
              similar identifiers.
            </p>

            <p className="mb-3">
              We use these technologies to understand website traffic and measure
              advertising effectiveness.
            </p>

            <p>
              Third-party providers may process information according to their own
              privacy policies.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">5. Cookies</h2>

            <p className="mb-3">
              Our website and service providers may use cookies and similar
              technologies.
            </p>

            <p>
              You may be able to control or limit cookies through your browser
              settings or privacy controls provided by third-party services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">
              6. How We Share Information
            </h2>

            <p className="mb-3">
              We may share information with service providers that help us operate
              the business, including providers for website hosting, payments,
              communications, advertising and measurement, and other
              business-support services.
            </p>

            <p>
              We may also disclose information when required by law or when
              reasonably necessary to protect our rights, users, or services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">7. Payments</h2>

            <p>
              Payments may be processed by third-party payment processors. Payment
              information is subject to the privacy and security practices of
              those providers.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">8. Data Retention</h2>

            <p>
              We retain information for as long as reasonably necessary for the
              purposes described in this Policy, including providing services,
              maintaining business records, complying with legal obligations, and
              resolving disputes.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">9. Security</h2>

            <p>
              We use reasonable measures designed to protect personal information.
              However, no method of transmission or storage can be guaranteed to be
              completely secure.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">10. Your Choices</h2>

            <p className="mb-3">
              You may contact us regarding questions about your personal
              information or to request access, correction, or deletion where
              applicable.
            </p>

            <p>
              You may also use browser settings and other available privacy
              controls to manage cookies and online tracking.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">
              11. Children&apos;s Privacy
            </h2>

            <p>
              MindMirror3D is not intended for children under 13, and we do not
              knowingly collect personal information from children under 13.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">
              12. Changes to This Policy
            </h2>

            <p>
              We may update this Privacy Policy from time to time. The effective
              date at the top will indicate when the Policy was last updated.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">13. Contact</h2>

            <p>
              If you have questions or requests regarding this Privacy Policy or
              your personal information, please contact us through our{' '}
              <Link
                href="/contact"
                className="text-blue-600 hover:underline font-medium"
              >
                Contact page
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t mt-12 py-6 text-center text-sm text-gray-600">
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
      </footer>
    </>
  );
}
// pages/payment.js
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabaseClient';

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [infoLoading, setInfoLoading] = useState(true);

  // Shipping address (U.S.-only for now)
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateUS, setStateUS] = useState('');
  const [zip, setZip] = useState('');

  // Load current user info from Supabase
  useEffect(() => {
    (async () => {
      setInfoLoading(true);
      setMsg('');

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setMsg('Please log in to continue to payment.');
        setInfoLoading(false);
        return;
      }

      setEmail(user.email || '');

      // Try to load full_name from profiles (if you use a profiles table)
      try {
        const { data: profile, error: profError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (!profError && profile?.full_name) {
          setFullName(profile.full_name);
        }
      } catch (e) {
        // silently ignore profile load issues
      }

      setInfoLoading(false);
    })();
  }, []);

  const handlePayNow = async () => {
    setMsg('');
  
    // Basic validation
    if (!fullName.trim()) {
      setMsg('Please enter your full name before proceeding to payment.');
      return;
    }
    if (!addressLine1.trim() || !city.trim() || !stateUS.trim() || !zip.trim()) {
      setMsg('Please enter your full U.S. shipping address before proceeding.');
      return;
    }
    if (zip.trim().length < 5) {
      setMsg('Please enter a valid U.S. ZIP code (at least 5 digits).');
      return;
    }
  
    // 👉 NEW: derive first name from fullName
    const cleanedFullName = fullName.trim();
    const firstName = cleanedFullName.split(' ')[0]; // everything before first space
  
    setLoading(true);
    try {
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: cleanedFullName,
          first_name: firstName,              // 👉 NEW: send first_name too
          shipping_address: {
            line1: addressLine1.trim(),
            line2: addressLine2.trim() || null,
            city: city.trim(),
            state: stateUS.trim(),
            postal_code: zip.trim(),
            country: 'US',
          },
        }),
      });
  
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to create session');
  
      window.location.href = data.url;
    } catch (e) {
      setMsg(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-16 text-center text-gray-800">
        {/* Intro */}
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          Your Personalized MindMirror Sculpture
        </h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          You’ve completed your personality journey — now we’ll turn your results into a 3D sculpture that
          <span className="font-semibold text-gray-800"> represents your inner self</span>.
          Each piece is custom-designed and shipped with a printed guidebook explaining the meaning behind your form.
        </p>

        {/* Your Information */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8 text-left">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Your Information
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            We’ll use this information for your order and to personalize your MindMirror booklet.
          </p>

          {infoLoading ? (
            <p className="text-sm text-gray-500">Loading your information…</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This name will appear on your cover and in your printed booklet.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  We’ll send your order confirmation and updates to this email.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Shipping Address (US only) */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8 text-left">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Shipping Address (United States)
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            We currently ship within the U.S. Please enter the address where you’d like to receive your sculpture and booklet.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Street address, P.O. box, company name, c/o"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apartment, suite, etc. (optional)
              </label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Apartment, suite, unit, building, floor, etc."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={stateUS}
                  onChange={(e) => setStateUS(e.target.value)}
                  placeholder="CA, NY, TX..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="e.g. 95112"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                value="United States"
                readOnly
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        {/* Price Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 shadow-sm mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Sculpture + Guidebook
          </h2>
          <p className="text-gray-600 mb-4">
            Personalized design • Free U.S. shipping
          </p>
          <p className="text-4xl font-bold text-blue-600 mb-6">$199</p>
          <button
            onClick={handlePayNow}
            disabled={loading || infoLoading}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl text-lg font-medium hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? 'Redirecting…' : 'Place Order'}
          </button>
          {msg && <p className="mt-4 text-sm text-red-600">{msg}</p>}
        </div>

        {/* Trust & reassurance */}
        <div className="text-gray-500 text-sm leading-relaxed space-y-2">
          <p>
            Your payment is securely processed by{' '}
            <span className="text-gray-700 font-medium">Stripe</span>.
          </p>
          <p>
            Once your order is complete, you’ll receive an email confirmation and updates as we design your sculpture.
          </p>
          <p>
            Questions?{' '}
            <a href="/contact" className="text-blue-600 hover:underline">
              Contact us anytime
            </a>
            .
          </p>
        </div>
      </main>
    </>
  );
}

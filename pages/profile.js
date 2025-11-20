// pages/profile.js
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import PersonalInfoForm from '../components/PersonalInfoForm';

export default function Profile() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(true);
  const [resultsError, setResultsError] = useState('');

  const [orderStatus, setOrderStatus] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Map status -> human text
  const statusLabel = (st) =>
    ({
      received: 'Order received',
      design: 'Sculpture in design',
      printing: 'Printing',
      shipped: 'Shipped',
    }[st] || 'Order received');

  // 1) Require login
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/auth');
        return;
      }
      setUser(data.user);
      setLoadingUser(false);
    })();
  }, [router]);

  // 2) Fetch this user's results row (includes order_status)
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingResults(true);
      setResultsError('');
      const { data, error } = await supabase
        .from('results')
        .select('bigfive_answers, basicneeds_answers, order_status, email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        setResultsError(error.message || 'Failed to load results');
        setResults(null);
        setOrderStatus(null);
      } else {
        setResults(data || null);
        setOrderStatus(data?.order_status ?? null);
      }
      setLoadingResults(false);
    })();
  }, [user]);

  // 3) Completion checks
  const hasBigFive = useMemo(() => {
    const a = results?.bigfive_answers;
    return Array.isArray(a) && a.length === 50 && a.every((v) => Number.isFinite(v));
  }, [results]);

  const hasBasicNeeds = useMemo(() => {
    const a = results?.basicneeds_answers;
    return Array.isArray(a) && a.length === 35 && a.every((v) => Number.isFinite(v));
  }, [results]);

  // 4) Save order status to Supabase (create row if missing)
  const setOrderStatusRemote = async (newStatus) => {
    if (!user) return;
    setSavingOrder(true);
    setOrderError('');
    try {
      // If no row yet, upsert a new one; else, update existing
      const payload = {
        user_id: user.id,
        email: user.email ?? null,
        order_status: newStatus,
      };

      const { error } = await supabase
        .from('results')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;

      setOrderStatus(newStatus);
    } catch (e) {
      console.error('Order status save error:', e);
      setOrderError(e?.message || 'Failed to save order status');
    } finally {
      setSavingOrder(false);
    }
  };

  // 5) Place order -> set status, then go to payment
  const placeOrder = async () => {
    router.push('/payment');
  };

  const isLoading = loadingUser || loadingResults;

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12 text-gray-800">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-gray-600 mt-2">{user?.email}</p>
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="mb-6 text-center text-gray-500">Loading your status…</div>
        )}
        {!!resultsError && (
          <div className="mb-6 text-center text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
            {resultsError}
          </div>
        )}

        {/* Journey */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {/* Step 1: Sign Up */}
          <div className="p-4 bg-white rounded-xl shadow">
            <div className="text-sm text-gray-500 mb-1">Step 1</div>
            <div className="font-semibold">Sign Up</div>
            <div className="mt-2 text-green-600 text-sm">Completed</div>
          </div>
          
          {/* Step 2: Big Five */}
          <div className="p-4 bg-white rounded-xl shadow">
            <div className="text-sm text-gray-500 mb-1">Step 2</div>
            <div className="font-semibold">Big Five Test</div>
            <div className="mt-2 text-sm">
              {isLoading ? (
                <span className="text-gray-500">Checking…</span>
              ) : hasBigFive ? (
                <span className="text-green-600">Completed</span>
              ) : (
                <div className="flex flex-col items-start gap-2">
                  <span className="text-amber-600">Not completed</span>
                  <Link href="/test-bigfive">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition cursor-pointer">
                      Take Big Five
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Basic Needs */}
          <div className="p-4 bg-white rounded-xl shadow">
            <div className="text-sm text-gray-500 mb-1">Step 3</div>
            <div className="font-semibold">Basic Needs Test</div>
            <div className="mt-2 text-sm">
              {isLoading ? (
                <span className="text-gray-500">Checking…</span>
              ) : hasBasicNeeds ? (
                <span className="text-green-600">Completed</span>
              ) : hasBigFive ? (
                <div className="flex flex-col items-start gap-2">
                  <span className="text-amber-600">Not completed</span>
                  <Link href="/test-basicneeds">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition cursor-pointer">
                      Continue Basic Needs
                    </span>
                  </Link>
                </div>
              ) : (
                <div className="text-gray-500">Complete Big Five first</div>
              )}
            </div>
          </div>

          {/* Step 4: Order & Delivery */}
          <div className="p-4 bg-white rounded-xl shadow">
            <div className="text-sm text-gray-500 mb-1">Step 4</div>
            <div className="font-semibold">Order & Delivery</div>

            <div className="mt-2 text-sm text-gray-700">
              {orderStatus ? statusLabel(orderStatus) : 'No order yet'}
            </div>

            {orderError && (
              <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                {orderError}
              </div>
            )}

            {/* CTA area */}
            {!orderStatus ? (
              <div className="mt-3">
                {hasBigFive && hasBasicNeeds ? (
                  <button
                    onClick={placeOrder}
                    disabled={savingOrder}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {savingOrder ? 'Processing…' : 'Order My Sculpture'}
                  </button>
                ) : (
                  <div className="text-xs text-gray-500">
                    Complete both tests to place your order.
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-4">
                <Link href="/payment" className="text-blue-600 hover:underline">
                  Manage payment
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Account */}
        <section className="text-center">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/');
            }}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Log Out
          </button>
        </section>
      </main>
    </>
  );
}

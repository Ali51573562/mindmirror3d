// pages/profile.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import Link from 'next/link';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/auth');
      } else {
        setUser(data.user);
      }
    })();
  }, [router]);

  useEffect(() => {
    try {
      const st = localStorage.getItem('order_status');
      if (st) setOrderStatus(st);
    } catch {}
  }, []);

  const placeOrder = () => {
    try {
      localStorage.setItem('order_status', 'received');
    } catch {}
    router.push('/payment');
  };

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12 text-gray-800">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-gray-600 mt-2">{user?.email}</p>
        </div>

        {/* Journey */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="p-4 bg-white rounded-xl shadow">
            <div className="text-sm text-gray-500 mb-1">Step 1</div>
            <div className="font-semibold">Sign Up</div>
            <div className="mt-2 text-green-600 text-sm">Completed</div>
          </div>
          <div className="p-4 bg-white rounded-xl shadow">
            <div className="text-sm text-gray-500 mb-1">Step 2</div>
            <div className="font-semibold">Big Five Test</div>
            <div className="mt-2 text-sm text-green-600">Completed</div>
          </div>
          <div className="p-4 bg-white rounded-xl shadow">
            <div className="text-sm text-gray-500 mb-1">Step 3</div>
            <div className="font-semibold">Basic Needs Test</div>
            <div className="mt-2 text-sm text-green-600">Completed</div>
          </div>
          <div className="p-4 bg-white rounded-xl shadow">
            <div className="text-sm text-gray-500 mb-1">Step 4</div>
            <div className="font-semibold">Order & Delivery</div>
            <div className="mt-2 text-sm text-gray-700">
              {orderStatus
                ? ({
                    received: 'Order received',
                    design: 'Sculpture in design',
                    printing: 'Printing',
                    shipped: 'Shipped',
                  }[orderStatus] || 'Order received')
                : 'No order yet'}
            </div>
          </div>
        </section>

        {/* Order/Sculpture */}
        <section className="p-6 bg-white rounded-xl shadow mb-12">
          <h2 className="text-xl font-semibold mb-4">Your Sculpture</h2>
          <p className="text-gray-600 mb-4">
            Once your order is placed, we’ll start designing your personalized sculpture based on your test results.
          </p>

          {!orderStatus ? (
            <button
              onClick={placeOrder}
              className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Order My Sculpture
            </button>
          ) : (
            <div className="text-sm text-gray-700">
              Status:&nbsp;
              <span className="font-medium">
                {({
                  received: 'Order received',
                  design: 'Sculpture in design',
                  printing: 'Printing',
                  shipped: 'Shipped',
                }[orderStatus] || 'Order received')}
              </span>
              <div className="mt-4">
                <Link href="/payment" className="text-blue-600 hover:underline">
                  Manage payment
                </Link>
              </div>
            </div>
          )}
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

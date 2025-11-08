import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function CancelPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Canceled</h1>
        <p className="text-gray-700 mb-8">
          No worries — your card wasn’t charged. You can try again anytime.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/payment">
            <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition">
              Try Again
            </button>
          </Link>
          <Link href="/">
            <button className="border border-gray-300 px-5 py-2 rounded-lg hover:bg-gray-50 transition">
              Home
            </button>
          </Link>
        </div>
      </main>
    </>
  );
}

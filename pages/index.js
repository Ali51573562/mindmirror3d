import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6">
          Discover Your True Self Through Personalized Art
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-10">
          Take two insightful personality tests to create a custom sculpture that reflects who you are.
        </p>
        <Link href="/profile">
          <button className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-blue-700 transition">
            Start Your Journey
          </button>
        </Link>
        <div className="mt-12">
          <img
            src="/hero-sculpture.png"
            alt="Person admiring a sculpture"
            className="mx-auto rounded-lg shadow-md"
          />
        </div>
      </main>

      <section className="bg-gray-50 py-16 px-6" id="how">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
            <div>
              <h3 className="text-xl font-semibold mb-2">1. Take the Test</h3>
              <p className="text-gray-600">
                Sign up and complete two personality assessments: the Big Five and Basic Needs tests. It only takes a few minutes.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">2. We Design Your Sculpture</h3>
              <p className="text-gray-600">
                Using your results, we design a unique 3D sculpture that reflects your personality profile.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">3. Receive Art That Represents You</h3>
              <p className="text-gray-600">
                Your sculpture and guidebook are printed, packed, and shipped to your door. No preview, just a surprise reflection of you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="text-center py-10 px-6 bg-white">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Ready to see yourself in a new dimension?
        </h2>
        <Link href="/profile">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700 transition">
            Start Now
          </button>
        </Link>

      </section>

      <footer className="text-center text-sm text-gray-400 py-10">
        &copy; 2025 MindMirror3D. All rights reserved.
      </footer>
    </>
  );
}

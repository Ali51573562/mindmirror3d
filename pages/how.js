import Navbar from '../components/Navbar';

export default function HowItWorks() {
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-12">
          How It Works
        </h1>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="text-blue-600 text-5xl font-bold mb-4">1</div>
            <h2 className="text-xl font-semibold mb-2">Take Two Tests</h2>
            <p className="text-gray-600">
              Complete the Big Five and Basic Needs personality assessments to unlock your full profile. It only takes a few minutes.
            </p>
          </div>

          <div className="text-center">
            <div className="text-blue-600 text-5xl font-bold mb-4">2</div>
            <h2 className="text-xl font-semibold mb-2">Get Your Unique Sculpture</h2>
            <p className="text-gray-600">
              Our system translates your personality traits into a custom 3D sculpture — a one-of-a-kind piece of art that represents your inner self.
            </p>
          </div>

          <div className="text-center">
            <div className="text-blue-600 text-5xl font-bold mb-4">3</div>
            <h2 className="text-xl font-semibold mb-2">Explore Your Results</h2>
            <p className="text-gray-600">
              Alongside your sculpture, you'll receive a symbolic guidebook explaining the shapes, structures, and personality insights behind your design.
            </p>
          </div>
        </section>

        <div className="text-center mt-16">
          <a
            href="/profile"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition"
          >
            Start Your Journey
          </a>
        </div>
      </main>
    </>
  );
}

export default function Payment() {
  const handleClick = async () => {
    const res = await fetch('/api/create-checkout-session', { method: 'POST' });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  return (
    <main className="max-w-xl mx-auto py-20 text-center px-6">
      <h1 className="text-3xl font-bold mb-6">Order Your Sculpture</h1>
      <p className="mb-8 text-gray-600">
        Start the next step of your journey by completing payment.
      </p>
      <button
        onClick={handleClick}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Pay Now
      </button>
    </main>
  );
}

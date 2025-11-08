import Navbar from '../components/Navbar';

export default function Contact() {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-16 text-gray-800">
        <h1 className="text-4xl font-bold text-center mb-10">Contact Us</h1>

        <p className="text-lg text-center mb-8">
          We'd love to hear from you. Whether you have a question about your order, need help with the test, or just want to say hello—reach out!
        </p>

        <form className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" id="name" name="name" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" id="email" name="email" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
            <textarea id="message" name="message" rows="5" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required></textarea>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Send Message
          </button>
        </form>
      </main>
    </>
  );
}

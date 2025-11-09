import { useState } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabaseClient';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    const { error } = await supabase.from('public.contact_messages').insert([
      { name, email, message },
    ]);

    if (error) {
      console.error('Contact insert error:', error);
      setError(error.message);

    } else {
      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    }

    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-16 text-gray-800">
        <h1 className="text-4xl font-bold text-center mb-10">Contact Us</h1>

        {success && (
          <div className="mb-6 text-center text-green-700 bg-green-50 border border-green-200 rounded p-3">
            ✅ Your message was sent successfully!
          </div>
        )}

        {error && (
          <div className="mb-6 text-center text-red-700 bg-red-50 border border-red-200 rounded p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              id="message"
              name="message"
              rows="5"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      </main>
    </>
  );
}

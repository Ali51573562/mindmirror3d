import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';

export default function Auth() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(true); // Toggle between Sign Up / Login

  // Sign up function
  const handleSignUp = async () => {
    setLoading(true);
    setMessage('');

    // Determine where the user should be sent after clicking the email link
    const baseUrl =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://mindmirror3d.vercel.app'; // fallback for SSR

    const { error } = await supabase.auth.signUp(
      { email, password },
      {
        // 👇 this tells Supabase where to send users after they click the confirmation email
        emailRedirectTo: `${baseUrl}/auth/callback`,
      }
    );

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Check your email for a confirmation link!');
    }

    setLoading(false);
  };

  // Sign in function
  const handleSignIn = async () => {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Logged in!');
      router.push('/test'); // Redirect to test page
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <main className="max-w-md mx-auto mt-12 p-6 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h2>

        <div className="flex justify-center mb-6">
          <button
            onClick={() => setIsSignUp(true)}
            className={`px-4 py-2 rounded-l border ${isSignUp ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Sign Up
          </button>
          <button
            onClick={() => setIsSignUp(false)}
            className={`px-4 py-2 rounded-r border ${!isSignUp ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Log In
          </button>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          onClick={isSignUp ? handleSignUp : handleSignIn}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isSignUp ? 'Sign Up' : 'Log In'}
        </button>

        {message && <p className="text-center text-sm text-gray-700 mt-4">{message}</p>}
      </main>
    </>
  );
}

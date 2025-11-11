// pages/auth.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabaseClient';

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://mindmirror3d.com';

  const handleSignUp = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${baseUrl}/auth/callback`,
        },
      });

      if (error) {
        if (error.message?.includes('User already registered')) {
          setMessage('This email is already registered. Please log in instead.');
          setMode('login');
        } else {
          setMessage(error.message);
        }
        return;
      }

      // Success: email confirmation sent
      setMessage('✅ Check your email for a confirmation link!');
    } catch (e) {
      console.error('Signup error:', e);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      // Success: go to test (or profile if you prefer)
      router.replace('/test-bigfive');
    } catch (e) {
      console.error('Login error:', e);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}/auth/callback`,
        },
      });
      if (error) setMessage(error.message);
      // On success, the browser redirects to Google; no further code executes here.
    } catch (e) {
      console.error('Google OAuth error:', e);
      setMessage('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'signup') await handleSignUp();
    else await handleLogin();
  };

  return (
    <>
      <Navbar />
      <main className="max-w-md mx-auto px-6 py-10 text-gray-800">
        <h1 className="text-3xl font-bold text-center mb-6">MindMirror3D</h1>

        {/* Tabs */}
        <div className="flex items-center justify-center mb-6">
          <button
            className={`px-4 py-2 rounded-l-lg border ${mode === 'signup' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
            onClick={() => { setMode('signup'); setMessage(''); }}
            disabled={loading}
          >
            Sign Up
          </button>
          <button
            className={`px-4 py-2 rounded-r-lg border-t border-b border-r ${mode === 'login' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
            onClick={() => { setMode('login'); setMessage(''); }}
            disabled={loading}
          >
            Log In
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 bg-white p-5 rounded-xl shadow">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? (mode === 'signup' ? 'Creating account…' : 'Logging in…') : (mode === 'signup' ? 'Create Account' : 'Log In')}
          </button>

          <div className="flex items-center my-2">
            <div className="flex-grow border-t border-gray-200" />
            <span className="px-3 text-xs text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
          >
            Continue with Google
          </button>

          {message && (
            <p className="text-sm mt-2 text-center text-gray-700">{message}</p>
          )}
        </form>

        <p className="text-xs text-center text-gray-400 mt-4">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </main>
    </>
  );
}

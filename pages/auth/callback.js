// pages/auth/callback.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/Navbar';

export default function AuthCallback() {
  const router = useRouter();
  const [msg, setMsg] = useState('Finalizing sign-in...');

  useEffect(() => {
    (async () => {
      try {
        // Try to exchange the URL code for a session (for email link sign-in)
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) console.warn('exchangeCodeForSession error:', error.message);
      } catch (e) {
        console.warn('No code exchange needed:', e?.message);
      }

      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        setMsg('Email confirmed! Redirecting...');
        router.replace('/profile'); // or /profile — wherever you want them to go
      } else {
        setMsg('Email confirmed! Please log in.');
        router.replace('/auth');
      }
    })();
  }, [router]);

  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">MindMirror3D</h1>
        <p className="text-gray-700">{msg}</p>
      </main>
    </>
  );
}

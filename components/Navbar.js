// components/Navbar.js
import Link from 'next/link';
import Image from 'next/image';
import { User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [testsCompleted, setTestsCompleted] = useState(false);

  // Helper: check answers completeness
  const isCompleteArray = (arr, expectedLen) =>
    Array.isArray(arr) &&
    arr.length === expectedLen &&
    arr.every((v) => typeof v === 'number' && v >= 1 && v <= 5);

  const refreshState = async () => {
    // check auth
    const { data } = await supabase.auth.getUser();
    const logged = !!data?.user;
    setIsLoggedIn(logged);

    // check test results
    let bf = [];
    let bn = [];
    try {
      bf = JSON.parse(localStorage.getItem('bigfive_answers') || '[]');
      bn = JSON.parse(localStorage.getItem('basicneeds_answers') || '[]');
    } catch {}
    setTestsCompleted(isCompleteArray(bf, 50) && isCompleteArray(bn, 35));
  };

  useEffect(() => {
    refreshState();

    // listen for localStorage changes
    const onStorage = (e) => {
      if (e.key === 'bigfive_answers' || e.key === 'basicneeds_answers') {
        refreshState();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Destination for "Take the Test"
  let testHref = '/auth';
  if (isLoggedIn && !testsCompleted) testHref = '/test-bigfive';
  if (isLoggedIn && testsCompleted) testHref = '/profile';

  // Destination for User icon
  const userHref = isLoggedIn ? '/profile' : '/auth';

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <Image src="/mindmirror3d-logo.png" alt="MindMirror3D Logo" width={40} height={40} />
          <span className="text-2xl font-bold text-blue-600 tracking-wide">MindMirror3D</span>
        </Link>

        {/* Navigation */}
        <div className="hidden md:flex items-center space-x-6 text-gray-700 font-medium">
          <Link href="/how">How It Works</Link>
          <Link href="/about">About Us</Link>
          <Link href="/contact">Contact</Link>

          {/* Smart "Take the Test" */}
          <Link href={testHref}>
            <span className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer">
              Take the Test
            </span>
          </Link>

          {/* User icon */}
          <Link href={userHref} className="hover:text-blue-600 transition">
            <User className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

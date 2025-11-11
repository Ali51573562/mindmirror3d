// components/Navbar.js
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const router = useRouter();
  const isHome = router.pathname === '/'; // you asked to hide logo on home
  const [open, setOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [router.pathname]);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo (hidden on home page as requested) */}
        {!isHome ? (
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/mindmirror3d-logo.png"
              alt="MindMirror3D Logo"
              width={40}
              height={40}
              priority
            />
            <span className="text-2xl font-bold text-blue-600 tracking-wide">
              MindMirror3D
            </span>
          </Link>
        ) : (
          <span className="w-10 h-10" aria-hidden="true" />
        )}

        {/* Desktop links */}
        <div className="hidden md:flex items-center space-x-6 text-gray-700 font-medium">
          <Link href="#how" className="hover:text-blue-600">How It Works</Link>
          <Link href="#about" className="hover:text-blue-600">About Us</Link>
          <Link href="#contact" className="hover:text-blue-600">Contact</Link>

          <Link href="/auth">
            <span className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              Take the Test
            </span>
          </Link>

          {/* Simple user icon linking to profile (inline SVG, no deps) */}
          <Link href="/profile" aria-label="Profile" className="hover:text-blue-600">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21a8 8 0 1 0-16 0" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? (
            // X icon
            <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            // Hamburger icon
            <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 flex flex-col space-y-2 text-gray-700 font-medium">
            <Link href="#how" className="py-2 hover:text-blue-600">How It Works</Link>
            <Link href="#about" className="py-2 hover:text-blue-600">About Us</Link>
            <Link href="#contact" className="py-2 hover:text-blue-600">Contact</Link>

            <Link href="/auth" className="py-2">
              <span className="inline-block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Take the Test
              </span>
            </Link>

            <Link href="/profile" className="py-2 flex items-center gap-2 hover:text-blue-600">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21a8 8 0 1 0-16 0" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Profile</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

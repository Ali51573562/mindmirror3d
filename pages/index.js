import Link from 'next/link';
import Navbar from '../components/Navbar';
import { useEffect, useRef } from 'react';
import { trackFunnelEvent } from '../lib/funnel';

export default function Home() {
    const scroll50Tracked = useRef(false);

    // Track homepage view
    useEffect(() => {
        trackFunnelEvent('view_homepage', '/');
    }, []);

    // Track homepage engagement
    useEffect(() => {
        const timer10 = setTimeout(() => {
            trackFunnelEvent('homepage_10sec', '/');
        }, 10000);

        const timer30 = setTimeout(() => {
            trackFunnelEvent('homepage_30sec', '/');
        }, 30000);

        const handleScroll = () => {
            const scrollPosition = window.scrollY + window.innerHeight;
            const pageHeight = document.documentElement.scrollHeight;

            if (
                scrollPosition >= pageHeight * 0.5 &&
                !scroll50Tracked.current
            ) {
                scroll50Tracked.current = true;
                trackFunnelEvent('homepage_scroll_50', '/');
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            clearTimeout(timer10);
            clearTimeout(timer30);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleStartJourney = () => {
        trackFunnelEvent('start_journey_click', '/');
    };

    return (
        <>
            <Navbar />

            {/* HERO */}
            <main className="max-w-5xl mx-auto px-6 pt-12 pb-20 text-center">
                <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6">
                    See Your Inner Self Turned Into a Sculpture
                </h1>

                <div className="max-w-2xl mx-auto mb-8 text-left md:text-center">
                    <ul className="space-y-2 md:space-y-3 text-lg md:text-xl text-gray-600">
                        <li>• Take a 10-minute self-discovery test</li>
                        <li>• Reveal your traits, needs, and inner patterns</li>
                        <li>• Receive a sculpture + guidebook shaped by your results</li>
                    </ul>
                </div>

                <Link href="/profile">
                    <button
                        onClick={handleStartJourney}
                        className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-blue-700 transition"
                    >
                        Start the Self-Discovery Test
                    </button>
                </Link>

                <p className="text-sm text-gray-500 mt-3">
                    No payment required to begin.
                </p>

                <div className="mt-8">
                    <img
                        src="/hero-sculpture.png"
                        alt="Person admiring a MindMirror3D sculpture"
                        className="mx-auto rounded-lg shadow-md w-full max-w-3xl"
                    />
                </div>
            </main>

            {/* HOW IT WORKS */}
            <section className="bg-gray-50 py-16 px-6" id="how">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold mb-10 text-gray-800 text-center">
                        How MindMirror3D Works
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
                        <div>
                            <h3 className="text-xl font-semibold mb-3 text-gray-900">
                                1. Take the Self-Discovery Test
                            </h3>
                            <p className="text-gray-600">
                                Answer guided questions about your traits, needs, and inner
                                patterns.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-3 text-gray-900">
                                2. We Turn Your Results Into Form
                            </h3>
                            <p className="text-gray-600">
                                Your answers guide the symbolic structure of your sculpture.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-3 text-gray-900">
                                3. Receive Your Sculpture + Guidebook
                            </h3>
                            <p className="text-gray-600">
                                Your guidebook explains the meaning behind your sculpture.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHAT YOU RECEIVE */}
            <section className="bg-white py-16 px-6">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
                        A Complete Self-Discovery Experience
                    </h2>

                    <ul className="space-y-4 text-lg text-gray-600">
                        <li>✓ Physical sculpture</li>
                        <li>✓ Personalized guidebook</li>
                        <li>✓ Symbolic meaning explanation</li>
                        <li>✓ A visual reflection of your inner world</li>
                        <li>✓ A keepsake for personal reflection</li>
                    </ul>
                </div>
            </section>

            {/* WHY DIFFERENT */}
            <section className="bg-gray-50 py-16 px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6">
                        More Than a Test. More Than Art.
                    </h2>

                    <p className="text-lg text-gray-600 leading-relaxed">
                        Many self-discovery tools give you scores or labels. MindMirror3D
                        turns what you discover into something physical — a sculpture you
                        can see, hold, and reflect on.
                    </p>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="text-center py-16 px-6 bg-white">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">
                    Ready to See Your Inner Self?
                </h2>

                <Link href="/profile">
                    <button
                        onClick={handleStartJourney}
                        className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-blue-700 transition"
                    >
                        Start the Self-Discovery Test
                    </button>
                </Link>

                <p className="text-sm text-gray-500 mt-3">
                    No payment required to begin.
                </p>
            </section>

            <footer className="text-center text-sm text-gray-400 py-10">
                <p>&copy; 2026 MindMirror3D. All rights reserved.</p>

                <Link
                    href="/privacy"
                    className="inline-block mt-2 hover:text-gray-600 hover:underline"
                >
                    Privacy Policy
                </Link>
            </footer>
        </>
    );
}
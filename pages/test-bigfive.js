// pages/test-bigfive.js
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

// IPIP-50 (statements only, no (+/-) shown to the user)
const questions = [
  'Am the life of the party.',
  'Feel little concern for others.',
  'Am always prepared.',
  'Get stressed out easily.',
  'Have a rich vocabulary.',
  "Don't talk a lot.",
  'Am interested in people.',
  'Leave my belongings around.',
  'Am relaxed most of the time.',
  'Have difficulty understanding abstract ideas.',
  'Feel comfortable around people.',
  'Insult people.',
  'Pay attention to details.',
  'Worry about things.',
  'Have a vivid imagination.',
  'Keep in the background.',
  "Sympathize with others' feelings.",
  'Make a mess of things.',
  'Seldom feel blue.',
  'Am not interested in abstract ideas.',
  'Start conversations.',
  "Am not interested in other people's problems.",
  'Get chores done right away.',
  'Am easily disturbed.',
  'Have excellent ideas.',
  'Have little to say.',
  'Have a soft heart.',
  'Often forget to put things back in their proper place.',
  'Get upset easily.',
  'Do not have a good imagination.',
  'Talk to a lot of different people at parties.',
  "Am not really interested in others.",
  'Like order.',
  'Change my mood a lot.',
  'Am quick to understand things.',
  "Don't like to draw attention to myself.",
  "Take time out for others.",
  'Shirk my duties.',
  'Have frequent mood swings.',
  'Use difficult words.',
  "Don't mind being the center of attention.",
  "Feel others' emotions.",
  'Follow a schedule.',
  'Get irritated easily.',
  'Spend time reflecting on things.',
  'Am quiet around strangers.',
  'Make people feel at ease.',
  'Am exacting in my work.',
  'Often feel blue.',
  'Am full of ideas.',
];

export default function TestBigFive() {
  const router = useRouter();
  const total = questions.length; // 50

  const [user, setUser] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(Array(total).fill(null)); // 1..5
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Require login; load saved progress if present
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.push('/auth');
        return;
      }
      setUser(data.user);

      // Load saved progress from localStorage
      try {
        const saved = JSON.parse(localStorage.getItem('bigfive_answers') || '[]');
        if (Array.isArray(saved) && saved.length === total) {
          setAnswers(saved);
          const firstUnanswered = saved.findIndex((v) => v == null);
          setCurrent(firstUnanswered === -1 ? 0 : firstUnanswered);
        }
      } catch {
        // ignore parsing errors
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = useMemo(
    () => Math.round(((current) / total) * 100),
    [current, total]
  );

  const persistLocal = (arr) => {
    try {
      localStorage.setItem('bigfive_answers', JSON.stringify(arr));
    } catch {}
  };

  const isCompleteArray = (arr) =>
    Array.isArray(arr) &&
    arr.length === total &&
    arr.every((v) => typeof v === 'number' && v >= 1 && v <= 5);

  // Save to Supabase (UPSERT by user_id)
  const saveToSupabase = async (finalAnswers) => {
    if (!user) throw new Error('Not logged in');
    if (!isCompleteArray(finalAnswers)) throw new Error('Answers are incomplete or invalid');

    const { error } = await supabase
      .from('results')
      .upsert(
        {
          user_id: user.id,
          email: user.email ?? null,
          bigfive_answers: finalAnswers, // jsonb
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;
  };

  const handleSelect = async (val) => {
    setErrorMsg('');
    const next = [...answers];
    next[current] = val;
    setAnswers(next);
    persistLocal(next);

    // Auto-advance or finish
    if (current + 1 < total) {
      setCurrent(current + 1);
      return;
    }

    // FINISH: save and route to Basic Needs
    try {
      setSaving(true);
      await saveToSupabase(next);
      setDone(true); // show thank-you briefly
      // small delay for UX, then go to Basic Needs
      setTimeout(() => router.replace('/test-basicneeds'), 600);
    } catch (e) {
      console.error('Big Five save failed:', e);
      setErrorMsg(
        'We saved your answers locally, but syncing to the server failed. Please try again or contact support.'
      );
      setDone(true);
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    setErrorMsg('');
    if (current > 0) setCurrent(current - 1);
  };

  return (
    <>
      <Navbar />

      <main className="max-w-2xl mx-auto p-6 mt-10">
        {!done ? (
          <>
            {/* Intro (optional small blurb) */}
            <div className="mb-6 text-gray-700">
              <h1 className="text-2xl font-bold mb-2">Big Five Personality Test</h1>
              <p className="text-sm">
                Describe yourself as you generally are now. For each statement, choose from 1 (Very Inaccurate) to 5 (Very Accurate).
              </p>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Question {current + 1} of {total}
                </span>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-2 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Fixed-height question area to prevent layout shift */}
            <div className="min-h-[120px] md:min-h-[96px] flex items-center justify-center mb-8">
              <p className="text-2xl font-semibold text-gray-800 text-center max-w-prose">
                {questions[current]}
              </p>
            </div>

            {/* Fixed row: 5 choices, always same positions */}
            <div className="max-w-lg mx-auto">
              <div className="grid grid-cols-5 gap-3 mb-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleSelect(val)}
                    disabled={saving}
                    className={`w-12 h-12 mx-auto rounded-full font-bold transition ${
                      saving
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 text-[11px] text-gray-500">
                <span className="text-left">Very Inaccurate</span>
                <span></span>
                <span className="text-center">Neither</span>
                <span></span>
                <span className="text-right">Very Accurate</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-between mt-8">
              <button
                onClick={goBack}
                disabled={current === 0 || saving}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-40"
              >
                Back
              </button>
              {saving ? <span className="text-sm text-gray-500">Saving…</span> : <span />}
            </div>

            {errorMsg ? (
              <p className="mt-4 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3">
                {errorMsg}
              </p>
            ) : null}
          </>
        ) : (
          // Brief “thanks” before redirect to Basic Needs
          <div className="text-center mt-20">
            <h2 className="text-3xl font-bold text-blue-600 mb-3">Thank you!</h2>
            <p className="text-lg text-gray-700 mb-6">
              Your Big Five answers are saved. Next up: Basic Needs.
            </p>
            <Link href="/test-basicneeds" className="inline-block">
              <span className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition cursor-pointer">
                Continue to Basic Needs
              </span>
            </Link>
          </div>
        )}
      </main>
    </>
  );
}

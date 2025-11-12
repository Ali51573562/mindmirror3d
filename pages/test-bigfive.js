// pages/test-bigfive.js
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

// Simplified & friendlier IPIP-50 items
const questions = [
  "I like to be the center of attention at social gatherings.",
  "I don’t worry much about other people’s feelings.",
  "I plan ahead and stay organized.",
  "I get nervous or stressed easily.",
  "I enjoy learning new words and using them.",
  "I’m usually quiet and reserved.",
  "I care about what’s going on in other people’s lives.",
  "I’m not very tidy or organized.",
  "I stay calm and relaxed most of the time.",
  "I find it hard to understand complicated or abstract ideas.",
  "I feel confident and comfortable around others.",
  "I sometimes say mean or harsh things to people.",
  "I notice small details and like to do things carefully.",
  "I often worry about things.",
  "I have a creative imagination.",
  "I prefer to stay in the background rather than be noticed.",
  "I easily understand how other people feel.",
  "I can be careless or make a mess of things.",
  "I rarely feel sad or down.",
  "I’m not very interested in deep or abstract ideas.",
  "I like to start conversations with people.",
  "I don’t really care about other people’s problems.",
  "I finish tasks as soon as possible.",
  "I’m easily bothered by things around me.",
  "I come up with lots of new or clever ideas.",
  "I usually keep my thoughts to myself.",
  "I’m a soft-hearted and caring person.",
  "I often forget to put things back where they belong.",
  "I get upset or emotional easily.",
  "I’m not very imaginative.",
  "I enjoy meeting and talking with lots of different people.",
  "I’m not very interested in other people.",
  "I like things neat, clean, and in order.",
  "My mood changes a lot.",
  "I catch on quickly when learning something new.",
  "I don’t like drawing attention to myself.",
  "I take time to help and support others.",
  "I sometimes avoid my responsibilities.",
  "My emotions can go up and down quickly.",
  "I like using complex or advanced words.",
  "I’m comfortable being the center of attention.",
  "I can easily feel what others are feeling.",
  "I like to follow a routine or schedule.",
  "I get irritated or annoyed easily.",
  "I spend time thinking deeply about things.",
  "I’m shy or quiet around people I don’t know.",
  "I make others feel comfortable and welcome.",
  "I’m careful and precise with my work.",
  "I often feel sad or blue.",
  "I have a lot of new ideas or ways of thinking about things.",
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

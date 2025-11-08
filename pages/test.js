// pages/test-bigfive.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabaseClient';

const questions = [
  { id: 1,  text: 'Am the life of the party.' },
  { id: 2,  text: 'Feel little concern for others.' },
  { id: 3,  text: 'Am always prepared.' },
  { id: 4,  text: 'Get stressed out easily.' },
  { id: 5,  text: 'Have a rich vocabulary.' },
  { id: 6,  text: "Don't talk a lot." },
  { id: 7,  text: 'Am interested in people.' },
  { id: 8,  text: 'Leave my belongings around.' },
  { id: 9,  text: 'Am relaxed most of the time.' },
  { id: 10, text: 'Have difficulty understanding abstract ideas.' },
  { id: 11, text: 'Feel comfortable around people.' },
  { id: 12, text: 'Insult people.' },
  { id: 13, text: 'Pay attention to details.' },
  { id: 14, text: 'Worry about things.' },
  { id: 15, text: 'Have a vivid imagination.' },
  { id: 16, text: 'Keep in the background.' },
  { id: 17, text: "Sympathize with others' feelings." },
  { id: 18, text: 'Make a mess of things.' },
  { id: 19, text: 'Seldom feel blue.' },
  { id: 20, text: 'Am not interested in abstract ideas.' },
  { id: 21, text: 'Start conversations.' },
  { id: 22, text: "Am not interested in other people's problems." },
  { id: 23, text: 'Get chores done right away.' },
  { id: 24, text: 'Am easily disturbed.' },
  { id: 25, text: 'Have excellent ideas.' },
  { id: 26, text: 'Have little to say.' },
  { id: 27, text: 'Have a soft heart.' },
  { id: 28, text: 'Often forget to put things back in their proper place.' },
  { id: 29, text: 'Get upset easily.' },
  { id: 30, text: 'Do not have a good imagination.' },
  { id: 31, text: 'Talk to a lot of different people at parties.' },
  { id: 32, text: 'Am not really interested in others.' },
  { id: 33, text: 'Like order.' },
  { id: 34, text: 'Change my mood a lot.' },
  { id: 35, text: 'Am quick to understand things.' },
  { id: 36, text: "Don't like to draw attention to myself." },
  { id: 37, text: 'Take time out for others.' },
  { id: 38, text: 'Shirk my duties.' },
  { id: 39, text: 'Have frequent mood swings.' },
  { id: 40, text: 'Use difficult words.' },
  { id: 41, text: "Don't mind being the center of attention." },
  { id: 42, text: "Feel others' emotions." },
  { id: 43, text: 'Follow a schedule.' },
  { id: 44, text: 'Get irritated easily.' },
  { id: 45, text: 'Spend time reflecting on things.' },
  { id: 46, text: 'Am quiet around strangers.' },
  { id: 47, text: 'Make people feel at ease.' },
  { id: 48, text: 'Am exacting in my work.' },
  { id: 49, text: 'Often feel blue.' },
  { id: 50, text: 'Am full of ideas.' },
];

export default function TestBigFive() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const total = questions.length;
  const progress = Math.round((current / total) * 100);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auth check + load saved progress
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.push('/auth');
        return;
      }
      setUser(data.user);

      // Load progress from localStorage (if any)
      try {
        const saved = JSON.parse(localStorage.getItem('bigfive_answers') || '[]');
        if (Array.isArray(saved) && saved.length === total) {
          setAnswers(saved);
          // Resume at first unanswered, else last
          const firstUnanswered = saved.findIndex((v) => v == null);
          setCurrent(firstUnanswered === -1 ? 0 : firstUnanswered);
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist incremental progress
  const persistLocal = (next) => {
    try {
      localStorage.setItem('bigfive_answers', JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  // Save to Supabase (upsert by user_id)
  const saveToSupabase = async (finalAnswers) => {
    if (!user) throw new Error('Not logged in');
    const payload = {
      user_id: user.id,
      email: user.email ?? null,
      bigfive_answers: finalAnswers,
    };
    const { error } = await supabase
      .from('results')
      .upsert(payload, { onConflict: 'user_id' });
    if (error) throw error;
  };

  const handleSelect = async (val) => {
    setErrorMsg('');
    const next = [...answers];
    next[current] = val;
    setAnswers(next);
    persistLocal(next);

    if (current + 1 < total) {
      setCurrent(current + 1);
      return;
    }

    // Finished — save and go to Basic Needs
    try {
      setSaving(true);
      await saveToSupabase(next);
      router.push('/test-basicneeds');
    } catch (e) {
      console.error('Save Big Five failed:', e);
      setErrorMsg('We saved your progress locally, but syncing to the server failed. You can continue.');
      // still allow moving forward:
      router.push('/test-basicneeds');
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

        {/* Fixed-height question block to prevent vertical shift */}
        <div className="min-h-[140px] md:min-h-[110px] flex items-center justify-center mb-8">
          <p className="text-2xl font-semibold text-gray-800 text-center max-w-prose">
            {questions[current].text}
          </p>
        </div>

        {/* 1–5 in fixed positions */}
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
                aria-label={`Select ${val}`}
              >
                {val}
              </button>
            ))}
          </div>
          {/* Likert labels under fixed positions */}
          <div className="grid grid-cols-5 text-[11px] text-gray-500">
            <span className="text-left">Very Inaccurate</span>
            <span></span>
            <span className="text-center">Neutral</span>
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
          {saving ? (
            <span className="text-sm text-gray-500">Saving…</span>
          ) : (
            <span />
          )}
        </div>

        {errorMsg ? (
          <p className="mt-4 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3">
            {errorMsg}
          </p>
        ) : null}
      </main>
    </>
  );
}

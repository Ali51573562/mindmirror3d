// pages/test-basicneeds.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabaseClient';

const questions = [
  { id: 1,  text: 'To what extent do concerns such as savings, living expenses, housing, and career future occupy your mind?' },
  { id: 2,  text: 'How much do you think about your physical health, hygiene, and the possibility of getting sick?' },
  { id: 3,  text: 'How would you rate the intensity of your sexual desire?' },
  { id: 4,  text: 'How cautious are you when it comes to risky activities?' },
  { id: 5,  text: 'To what extent do you avoid new experiences or starting unfamiliar paths?' },
  { id: 6,  text: 'According to your friends and colleagues, how punctual, orderly, and accurate are you?' },
  { id: 7,  text: 'How important is job security and having a stable income to you?' },
  { id: 8,  text: 'How much love, intimacy, and affection do you feel you need?' },
  { id: 9,  text: 'How important is the well-being and happiness of other people to you?' },
  { id: 10, text: 'How much do you need to feel accepted and loved by others?' },
  { id: 11, text: 'How much do you need others to treat you with kindness and affection, and for you to feel that you belong with them?' },
  { id: 12, text: 'How much do you enjoy interacting with others and actively participating in gatherings, events, and group activities?' },
  { id: 13, text: 'According to your friends and colleagues, how warm, friendly, compassionate, and kind are you?' },
  { id: 14, text: 'How important is it to you to maintain good relationships with loved ones and people around you, and how much effort do you put into it?' },
  { id: 15, text: 'How important is it for you to make your own choices in what you do?' },
  { id: 16, text: 'To what extent do you believe no one should tell you how to run your life?' },
  { id: 17, text: 'To what extent are you willing to do what you want, regardless of pressure or interference from your partner?' },
  { id: 18, text: 'How strongly do you insist on having a say in both big and small life decisions?' },
  { id: 19, text: 'How much do you need personal time that you can use however you want?' },
  { id: 20, text: 'How willing are you to travel to new places?' },
  { id: 21, text: 'To what extent do you seek change and new experiences, and dislike static or repetitive environments?' },
  { id: 22, text: 'How much do you try to show yourself as a capable and competent person in your field?' },
  { id: 23, text: 'How much do you enjoy giving orders to others, rather than receiving them?' },
  { id: 24, text: 'How ambitious and competitive do you consider yourself to be?' },
  { id: 25, text: 'How much would you like others (children, spouse, or friends) to listen to you and follow your guidance?' },
  { id: 26, text: 'To what extent do you try to prove your ideas are right and persuade others to accept them?' },
  { id: 27, text: 'How concerned are you with personal growth and development, and how much do you seek to develop your abilities?' },
  { id: 28, text: 'How much time do you spend learning new things in different fields?' },
  { id: 29, text: 'How much do you enjoy joking around?' },
  { id: 30, text: 'How important is free time and entertainment to you?' },
  { id: 31, text: 'How would you rate your sense of humor?' },
  { id: 32, text: 'To what extent do you feel the need to engage in informal, enjoyable activities such as cycling, fishing, or watching movies?' },
  { id: 33, text: 'How much do you look for fun times and joyful situations such as celebrations, parties, and games?' },
  { id: 34, text: 'How important is laughter in your life?' },
  { id: 35, text: 'In your opinion, how important are fun, play, and enjoyment in life?' },
];

export default function TestBasicNeeds() {
  const router = useRouter();
  const total = questions.length; // 35

  const [user, setUser] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(Array(total).fill(null));
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Require login + load saved progress
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.push('/auth');
        return;
      }
      setUser(data.user);

      // Load from localStorage if available
      try {
        const saved = JSON.parse(localStorage.getItem('basicneeds_answers') || '[]');
        if (Array.isArray(saved) && saved.length === total) {
          setAnswers(saved);
          const firstUnanswered = saved.findIndex((v) => v == null);
          setCurrent(firstUnanswered === -1 ? 0 : firstUnanswered);
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = Math.round((current / total) * 100);

  // Persist to localStorage
  const persistLocal = (arr) => {
    try {
      localStorage.setItem('basicneeds_answers', JSON.stringify(arr));
    } catch {}
  };

  // Validate answers array before save
  const isCompleteArray = (arr) =>
    Array.isArray(arr) &&
    arr.length === total &&
    arr.every((v) => typeof v === 'number' && v >= 1 && v <= 5);

  // Save to Supabase (UPSERT)
  const saveToSupabase = async (finalAnswers) => {
    if (!user) throw new Error('Not logged in');
    if (!isCompleteArray(finalAnswers)) throw new Error('Answers are incomplete or invalid');

    console.log('Saving Basic Needs for:', user.email, finalAnswers);

    const { error } = await supabase
      .from('results')
      .upsert(
        {
          user_id: user.id,
          email: user.email ?? null,
          basicneeds_answers: finalAnswers, // IMPORTANT
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

    // FINISH: save to Supabase then show thank-you
    try {
      setSaving(true);
      await saveToSupabase(next);
      setDone(true);
    } catch (e) {
      console.error('Basic Needs save failed:', e);
      setErrorMsg(
        'We saved your answers locally, but syncing to the server failed. You can try again or contact support.'
      );
      setDone(true); // still show thank-you so user can continue
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

            {/* Fixed-height question */}
            <div className="min-h-[120px] md:min-h-[96px] flex items-center justify-center mb-8">
              <p className="text-2xl font-semibold text-gray-800 text-center max-w-prose">
                {questions[current].text}
              </p>
            </div>

            {/* Fixed 5-choice row */}
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
                <span className="text-left">Low</span>
                <span></span>
                <span className="text-center">Medium</span>
                <span></span>
                <span className="text-right">High</span>
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
          // Thank-you
          <div className="text-center mt-20">
            <h2 className="text-3xl font-bold text-blue-600 mb-3">Thank you!</h2>
            <p className="text-lg text-gray-700 mb-8">
              Your Basic Needs answers are saved. We’ll use both tests to design your sculpture.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/profile">
                <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">
                  Go to Profile
                </button>
              </Link>
              <Link href="/">
                <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition">
                  Back to Home
                </button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

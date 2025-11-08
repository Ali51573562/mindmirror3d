import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';

export default function Results() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchResults = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth'); // redirect to login
        return;
      }

      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error(error);
      } else {
        setResults(data[0]);
      }

      setLoading(false);
    };

    fetchResults();
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ padding: '2rem' }}>
        {loading ? (
          <p>Loading...</p>
        ) : !results ? (
          <p>No results found.</p>
        ) : (
          <>
            <h1>Your Test Results</h1>
            <ul>
              <li>Question 1: {results.q1}</li>
              <li>Question 2: {results.q2}</li>
              <li>Question 3: {results.q3}</li>
              <li>Question 4: {results.q4}</li>
              <li>Question 5: {results.q5}</li>
            </ul>
          </>
        )}
      </main>
    </>
  );
}

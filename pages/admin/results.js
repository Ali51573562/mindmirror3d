// pages/admin/results.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import { supabase } from '../../lib/supabaseClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


// --- Big Five scoring key ---
const scoring = {
  Extraversion: [[1,'+'],[6,'-'],[11,'+'],[16,'-'],[21,'+'],[26,'-'],[31,'+'],[36,'-'],[41,'+'],[46,'-']],
  Agreeableness: [[2,'-'],[7,'+'],[12,'-'],[17,'+'],[22,'-'],[27,'+'],[32,'-'],[37,'+'],[42,'+'],[47,'+']],
  Conscientiousness: [[3,'+'],[8,'-'],[13,'+'],[18,'-'],[23,'+'],[28,'-'],[33,'+'],[38,'-'],[43,'+'],[48,'+']],
  EmotionalStability: [[4,'-'],[9,'+'],[14,'-'],[19,'+'],[24,'-'],[29,'-'],[34,'-'],[39,'-'],[44,'-'],[49,'-']],
  IntellectImagination: [[5,'+'],[10,'-'],[15,'+'],[20,'-'],[25,'+'],[30,'-'],[35,'+'],[40,'+'],[45,'+'],[50,'+']],
};

function calcBigFive(answers) {
  if (!Array.isArray(answers) || answers.length !== 50) return null;
  const out = {};
  for (const [trait, items] of Object.entries(scoring)) {
    let sum = 0;
    for (const [q, sign] of items) {
      const raw = answers[q - 1];
      const val = sign === '+' ? raw : 6 - raw;
      sum += val;
    }
    out[trait] = Number((sum / items.length).toFixed(2));
  }
  return out;
}

// -------- PDF generator for Big Five --------
async function downloadPDF(userEmail, answers) {
  const scores = calcBigFive(answers);
  if (!scores) return alert('Incomplete Big Five answers.');

  // ✅ Dynamically import jsPDF + autoTable (works safely with Next.js)
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('MindMirror3D — Big Five Personality Report', 14, 18);

  doc.setFontSize(12);
  doc.text(`User: ${userEmail}`, 14, 28);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

  autoTable(doc, {
    startY: 48,
    head: [['Trait', 'Score (1–5)', 'Description']],
    body: Object.entries(scores).map(([trait, value]) => [
      trait,
      value,
      trait === 'Extraversion'
        ? 'Energy, sociability, assertiveness'
        : trait === 'Agreeableness'
        ? 'Kindness, empathy, cooperation'
        : trait === 'Conscientiousness'
        ? 'Organization, responsibility, discipline'
        : trait === 'EmotionalStability'
        ? 'Calmness, resilience, low stress'
        : 'Creativity, curiosity, open-mindedness',
    ]),
  });

  doc.save(`BigFive_${userEmail.replace(/@/g, '_')}.pdf`);
}


function downloadCSV(rows) {
  const header = ['email', 'has_bigfive', 'has_basicneeds', 'bigfive_answers', 'basicneeds_answers'];
  const data = rows.map(r => [
    r.email || '',
    r.bigfive_answers ? '1' : '0',
    r.basicneeds_answers ? '1' : '0',
    r.bigfive_answers ? JSON.stringify(r.bigfive_answers) : '',
    r.basicneeds_answers ? JSON.stringify(r.basicneeds_answers) : '',
  ]);
  const csv = [header, ...data].map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'MindMirror3D_Results.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminResults() {
  const router = useRouter();

  // Your admin email (as requested)
  const ADMIN_EMAIL = 'ali51573562@gmail.com';

  const [me, setMe] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user || null;
      setMe(user);

      const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const keyPreview = envKey ? envKey.slice(0, 8) + '…' : 'undefined';

      setDebugInfo({
        envUrl,
        anonKeyStart: keyPreview,
        currentUserEmail: user?.email || null,
        adminEmail: ADMIN_EMAIL,
      });

      if (!user) {
        setErr('Not logged in. Please sign in first.');
        setLoading(false);
        return;
      }
      if (user.email !== ADMIN_EMAIL) {
        setErr(`Access denied. Logged in as ${user.email}, but admin is ${ADMIN_EMAIL}.`);
        setLoading(false);
        return;
      }

      // Fetch results (show errors if RLS blocks)
      const { data: results, error, count } = await supabase
        .from('results')
        .select('*', { count: 'exact' });

      if (error) {
        console.error('Admin fetch error:', error);
        setErr(error.message || 'Unknown error fetching results.');
      } else {
        setRows(results || []);
        setDebugInfo((d) => ({ ...d, rowCount: count ?? results?.length ?? 0 }));
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading…</p>;

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10 text-gray-800">
        <h1 className="text-3xl font-bold mb-2">Admin — User Test Results</h1>
        <p className="text-gray-600 mb-6">
          Logged in as <span className="font-medium">{me?.email || '—'}</span>
        </p>

        {/* Debug panel */}
        <div className="mb-6 p-3 rounded border border-gray-200 bg-gray-50 text-sm">
          <div><span className="font-medium">Supabase URL:</span> {debugInfo.envUrl || 'undefined'}</div>
          <div><span className="font-medium">Anon key (start):</span> {debugInfo.anonKeyStart}</div>
          <div><span className="font-medium">Current user:</span> {debugInfo.currentUserEmail || 'null'}</div>
          <div><span className="font-medium">Admin email expected:</span> {debugInfo.adminEmail}</div>
          {'rowCount' in debugInfo && (
            <div><span className="font-medium">Query row count:</span> {debugInfo.rowCount}</div>
          )}
        </div>

        {err && (
          <div className="mb-6 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
            {err}
          </div>
        )}

        {!err && (
          <>
            <div className="mb-4">
              <button
                onClick={() => downloadCSV(rows)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition"
              >
                Download All as CSV
              </button>
            </div>

            {rows.length === 0 ? (
              <p className="text-gray-600">No results found yet.</p>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="p-2 border">Email</th>
                    <th className="p-2 border text-center">Big Five</th>
                    <th className="p-2 border text-center">Basic Needs</th>
                    <th className="p-2 border text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.user_id}>
                      <td className="p-2 border">{r.email}</td>
                      <td className="p-2 border text-center">{r.bigfive_answers ? '✅' : '—'}</td>
                      <td className="p-2 border text-center">{r.basicneeds_answers ? '✅' : '—'}</td>
                      <td className="p-2 border text-center">
                        {r.bigfive_answers ? (
                          <button
                            onClick={() => downloadPDF(r.email, r.bigfive_answers)}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                          >
                            Download PDF
                          </button>
                        ) : (
                          <span className="text-gray-400">No Big Five</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>
    </>
  );
}

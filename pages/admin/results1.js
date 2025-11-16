// pages/admin/results.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/Navbar';

const ADMIN_EMAIL = 'ali51573562@gmail.com';

// Helper to safely render values
const safe = (value) =>
  value === null || value === undefined || value === '' ? '—' : value;

// ---------- SCORING FUNCTIONS ----------

// Big Five scoring based on IPIP-50 key → returns raw + %
function scoreBigFive(answers) {
  if (!Array.isArray(answers) || answers.length !== 50) return null;

  const key = [
    [0, 'E', +1],
    [1, 'A', -1],
    [2, 'C', +1],
    [3, 'N', -1],
    [4, 'O', +1],
    [5, 'E', -1],
    [6, 'A', +1],
    [7, 'C', -1],
    [8, 'N', +1],
    [9, 'O', -1],
    [10, 'E', +1],
    [11, 'A', -1],
    [12, 'C', +1],
    [13, 'N', -1],
    [14, 'O', +1],
    [15, 'E', -1],
    [16, 'A', +1],
    [17, 'C', -1],
    [18, 'N', +1],
    [19, 'O', -1],
    [20, 'E', +1],
    [21, 'A', -1],
    [22, 'C', +1],
    [23, 'N', -1],
    [24, 'O', +1],
    [25, 'E', -1],
    [26, 'A', +1],
    [27, 'C', -1],
    [28, 'N', -1],
    [29, 'O', -1],
    [30, 'E', +1],
    [31, 'A', -1],
    [32, 'C', +1],
    [33, 'N', -1],
    [34, 'O', +1],
    [35, 'E', -1],
    [36, 'A', +1],
    [37, 'C', -1],
    [38, 'N', -1],
    [39, 'O', +1],
    [40, 'E', +1],
    [41, 'A', +1],
    [42, 'C', +1],
    [43, 'N', -1],
    [44, 'O', +1],
    [45, 'E', -1],
    [46, 'A', +1],
    [47, 'C', +1],
    [48, 'N', -1],
    [49, 'O', +1],
  ];

  const totals = { O: 0, C: 0, E: 0, A: 0, N: 0 };

  key.forEach(([index, trait, direction]) => {
    const raw = Number(answers[index]) || 0;
    const scored = direction === +1 ? raw : 6 - raw; // reverse-scored
    totals[trait] += scored;
  });

  // Each trait: 10 items * 1–5 → range 10–50
  const pct = (v) => {
    const normalized = ((v - 10) / 40) * 100;
    if (Number.isNaN(normalized)) return null;
    return Math.round(Math.max(0, Math.min(100, normalized)));
  };

  return {
    raw: {
      openness: totals.O,
      conscientiousness: totals.C,
      extraversion: totals.E,
      agreeableness: totals.A,
      neuroticism: totals.N,
    },
    pct: {
      Openness: pct(totals.O),
      Conscientiousness: pct(totals.C),
      Extraversion: pct(totals.E),
      Agreeableness: pct(totals.A),
      Neuroticism: pct(totals.N),
    },
  };
}

// Basic Needs scoring: 1–7 Survival, 8–14 Love, 15–21 Freedom, 22–28 Power, 29–35 Fun
function scoreBasicNeeds(arr) {
  if (!Array.isArray(arr) || arr.length !== 35) return null;

  const sum = (slice) => slice.reduce((a, b) => a + (Number(b) || 0), 0);

  const survival = sum(arr.slice(0, 7));
  const love = sum(arr.slice(7, 14));
  const freedom = sum(arr.slice(14, 21));
  const power = sum(arr.slice(21, 28));
  const fun = sum(arr.slice(28, 35));

  const pct = (v) => Math.round((v / 35) * 100);

  return {
    survival,
    survival_pct: pct(survival),
    love,
    love_pct: pct(love),
    freedom,
    freedom_pct: pct(freedom),
    power,
    power_pct: pct(power),
    fun,
    fun_pct: pct(fun),
  };
}

// ---------- BIG FIVE PAGE LAYOUT (PAGE #2) ----------
function drawBigFivePage(doc, row) {
  const pageWidth = doc.internal.pageSize.getWidth();  // 396 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 612 pt

  const TEXT_COLOR = '#1B2236';
  const BAR_COLOR = '#FFA860';

  // Parse Big Five and compute %
  const bf = scoreBigFive(row.bigfive_answers || []);
  if (!bf) {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(TEXT_COLOR);
    doc.text('Big Five test not completed or invalid answers.', 40, 80);
    return;
  }

  const bfPct = bf.pct;
  const sortedTraits = Object.entries(bfPct).sort((a, b) => b[1] - a[1]);
  const top1 = sortedTraits[0][0];
  const top2 = sortedTraits[1][0];

  // Completion date from created_at
  let completionDate = 'the day you took the test';
  if (row.created_at) {
    try {
      const d = new Date(row.created_at);
      completionDate = d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      completionDate = row.created_at;
    }
  }

  // Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(TEXT_COLOR);
  doc.text('Big Five Personality Results', pageWidth / 2, 60, {
    align: 'center',
  });

  // Subtitle (two lines, centered)
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(
    `Based on the online test you took on ${completionDate},`,
    pageWidth / 2,
    82,
    { align: 'center' }
  );
  doc.text(`this is your result scores.`, pageWidth / 2, 98, {
    align: 'center',
  });

  // Chart layout
  let y = 150;
  const barHeight = 26;
  const gap = 22;
  const left = 40;
  const right = pageWidth - 40;
  const maxBarWidth = right - left;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);

  sortedTraits.forEach(([trait, pct]) => {
    const width = (pct / 100) * maxBarWidth;

    // Bar
    doc.setFillColor(BAR_COLOR);
    doc.roundedRect(left, y, width, barHeight, 6, 6, 'F');

    const textY = y + barHeight / 2 + 4;

    // Trait text inside bar (left)
    doc.setTextColor(TEXT_COLOR);
    doc.text(trait, left + 8, textY);

    // Percent text inside bar (right)
    const pctText = `${pct}%`;
    const textWidth = doc.getTextWidth(pctText);
    doc.text(pctText, left + width - 8 - textWidth, textY);

    y += barHeight + gap;
  });

  // Summary text
  doc.setFontSize(12);
  doc.setTextColor(TEXT_COLOR);
  const summaryLines = [
    `Based on big 5 test you are a ${top1} and ${top2} person.`,
    'This trait is outstanding in your personality.',
    'So, these are your main traits.',
  ];
  doc.text(summaryLines, pageWidth / 2, pageHeight - 80, {
    align: 'center',
  });

  // Footer
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor('#777777');
  doc.text('MindMirror3D', pageWidth / 2, pageHeight - 40, {
    align: 'center',
  });
}

// ---------- BOOKLET PDF GENERATION ----------
const downloadPDF = async (row) => {
  const jsPDFModule = await import('jspdf');
  const { jsPDF } = jsPDFModule;

  // 5.5" × 8.5" in points (72 pt/inch)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [396, 612],
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const name = safe(row.full_name) !== '—' ? row.full_name : safe(row.email);

  // ---------- PAGE 1: COVER ----------
  doc.setFillColor('#FFFFFF');
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setTextColor('#1B2236');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('MindMirror3D', 40, 80);
  doc.setFontSize(16);
  doc.text('Personalized Personality Report', 40, 110);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`Prepared for: ${name}`, 40, 140);

  doc.setFont('Helvetica', 'italic');
  doc.text('A Deep Look Into Who You Are', 40, 165);

  // Move to next page
  doc.addPage();

  // ---------- PAGE 2: BIG FIVE PAGE (CHART) ----------
  drawBigFivePage(doc, row);

  // ---------- PAGE 3: BLANK ----------
  doc.addPage();
  // Leave blank intentionally (or add note later if you want)

  // ---------- PAGE 4: BACK COVER ----------
  doc.addPage();
  doc.setFillColor('#FFFFFF');
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(12);
  doc.setTextColor('#1B2236');
  doc.text('Created by MindMirror3D', pageWidth / 2, pageHeight / 2, {
    align: 'center',
  });

  const filename = `${(name || 'user')
    .replace(/[^a-z0-9@._-]/gi, '_')
    .toLowerCase()}_booklet.pdf`;
  doc.save(filename);
};

// ---------- CSV DOWNLOAD ----------
const downloadCSV = (rows) => {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));

  rows.forEach((row) => {
    const line = headers
      .map((h) => {
        let val = row[h];
        if (val && typeof val === 'object') {
          val = JSON.stringify(val);
        }
        if (val === null || val === undefined) val = '';
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',');
    csvRows.push(line);
  });

  const blob = new Blob([csvRows.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mindmirror3d_results.csv';
  a.click();
  URL.revokeObjectURL(url);
};

// ---------- MAIN COMPONENT ----------
export default function AdminResultsPage() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState('');

  // 1) Check that the user is logged in and is admin
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/');
        return;
      }

      const email = data.user.email || '';
      if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      setLoadingUser(false);
    })();
  }, [router]);

  // 2) Load results from Supabase
  useEffect(() => {
    if (!isAdmin) return;

    (async () => {
      setLoadingResults(true);
      setError('');

      const { data, error } = await supabase
        .from('results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading results:', error);
        setError(error.message || 'Failed to load results');
        setResults([]);
      } else {
        setResults(data || []);
      }

      setLoadingResults(false);
    })();
  }, [isAdmin]);

  if (loadingUser) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-700">
          Checking access…
        </main>
      </>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10 text-gray-800">
        <h1 className="text-3xl font-bold mb-4">Admin — Test Results</h1>
        <p className="text-gray-600 mb-6">
          Download user results as CSV or as a personalized MindMirror booklet
          (Big Five chart + cover + back).
        </p>

        {error && (
          <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            {loadingResults
              ? 'Loading results…'
              : `${results.length} result${
                  results.length === 1 ? '' : 's'
                } found`}
          </div>
          {results.length > 0 && (
            <button
              onClick={() => downloadCSV(results)}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900 transition"
            >
              Download CSV
            </button>
          )}
        </div>

        {results.length === 0 && !loadingResults && (
          <div className="text-gray-500 text-sm">No results found yet.</div>
        )}

        <div className="space-y-4">
          {results.map((row) => {
            const bf = scoreBigFive(row.bigfive_answers || []);
            const bn = scoreBasicNeeds(row.basicneeds_answers || []);

            return (
              <div
                key={row.id || row.user_id || row.email}
                className="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    {safe(row.full_name) !== '—' ? row.full_name : row.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    Email: {safe(row.email)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Big Five:{' '}
                    {bf
                      ? `O ${bf.pct.Openness}% | C ${bf.pct.Conscientiousness}% | E ${bf.pct.Extraversion}% | A ${bf.pct.Agreeableness}% | N ${bf.pct.Neuroticism}%`
                      : 'not completed'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Basic Needs:{' '}
                    {bn
                      ? `Survival ${bn.survival_pct}% | Love ${bn.love_pct}% | Freedom ${bn.freedom_pct}% | Power ${bn.power_pct}% | Fun ${bn.fun_pct}%`
                      : 'not completed'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => downloadPDF(row)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition"
                  >
                    Download Booklet PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}

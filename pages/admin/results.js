// pages/admin/results.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/Navbar';

const ADMIN_EMAIL = 'ali51573562@gmail.com';

// Helper to safely render values
const safe = (value) =>
  value === null || value === undefined || value === '' ? '—' : value;



// --------- LOAD HEAD DESCRIPTIONS (heads.txt) ----------
let headDescriptionsCache = null;

async function loadHeadDescriptions() {
  if (headDescriptionsCache) return headDescriptionsCache;

  const res = await fetch('/booklet/heads.txt');
  const text = await res.text();

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const map = {};

  for (const line of lines) {
    // Split at first ":" (some lines might be slightly irregular)
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();      // e.g. "AC-H1"
    const body = line.slice(colonIndex + 1).trim();    // e.g. "The forward tilt..."

    // Base key without the 1/2/3 index: "AC-H"
    const dashIndex = key.lastIndexOf('H');
    let baseKey = key;
    if (dashIndex !== -1) {
      baseKey = key.slice(0, dashIndex + 1);           // "AC-H"
    }

    if (!map[baseKey]) map[baseKey] = [];
    map[baseKey].push(body);
  }

  headDescriptionsCache = map;
  return map;
}


// --------- LOAD BODY DESCRIPTIONS (Bodies.txt) ----------
let bodyDescriptionsCache = null;

async function loadBodyDescriptions() {
    if (bodyDescriptionsCache) return bodyDescriptionsCache;

    const res = await fetch('/booklet/Bodies.txt');
    const text = await res.text();

    const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    const map = {};

    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const key = line.slice(0, colonIndex).trim();   // e.g. "FL-B1"
        const body = line.slice(colonIndex + 1).trim(); // description text

        // Base key without 1/2/3/4 → e.g. "FL-B"
        const baseKey = key.replace(/[0-9]+$/, '');

        if (!map[baseKey]) map[baseKey] = [];
        map[baseKey].push(body);
    }

    bodyDescriptionsCache = map;
    return map;
}

// --------- LOAD LEG DESCRIPTIONS (Legs.txt) ----------
let legDescriptionsCache = null;

async function loadLegDescriptions() {
    if (legDescriptionsCache) return legDescriptionsCache;

    const res = await fetch('/booklet/Legs.txt');
    const text = await res.text();

    const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    const map = {};

    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const key = line.slice(0, colonIndex).trim();   // e.g. "AC-L1"
        const body = line.slice(colonIndex + 1).trim(); // description text

        // Base key without 1/2/3 → "AC-L"
        const baseKey = key.replace(/[0-9]+$/, '');

        if (!map[baseKey]) map[baseKey] = [];
        map[baseKey].push(body);
    }

    legDescriptionsCache = map;
    return map;
}



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

  const pct = (v) => {
    // v = raw score 10–50
    const normalized = 20 + ((v - 10) / 40) * 80; // new 20–100 scale

    if (Number.isNaN(normalized)) return null;

    // Clamp between 20 and 100, and round
    return Math.round(Math.max(20, Math.min(100, normalized)));
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
      EmotionalStability: pct(totals.N),
    },
  };
}

// Map full trait key to your head-image letter
function traitKeyToLetter(traitKey) {
  switch (traitKey) {
    case 'Openness':
      return 'O';
    case 'Conscientiousness':
      return 'C';
    case 'Extraversion':
      return 'E';
    case 'Agreeableness':
      return 'A';
    case 'EmotionalStability':
      return 'M'; // "Mind / emotional stability"
    default:
      return 'X'; // fallback
  }
}

// Map Basic Need key to your body-image letter
function needKeyToLetter(needKey) {
  switch (needKey) {
    case 'Fun':
      return 'F';
    case 'Love':
      return 'L';
    case 'Freedom':
      return 'R'; // as you defined
    case 'Survival':
      return 'S';
    case 'Power':
      return 'P';
    default:
      return 'X'; // fallback
  }
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

  // Map raw 7–35 → 20–100
  const pct = (v) => {
    const normalized = 20 + ((v - 7) / 28) * 80; // 7 → 20%, 35 → 100%
    if (Number.isNaN(normalized)) return null;
    return Math.round(Math.max(20, Math.min(100, normalized)));
  };

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
  const pageWidth = doc.internal.pageSize.getWidth(); // 396 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 612 pt

  const TEXT_COLOR = '#1B2236';
  const BAR_COLOR = '#FFA860';

  const scored = scoreBigFive(row.bigfive_answers || []);
  if (!scored) {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(TEXT_COLOR);
    doc.text('Big Five test not completed or invalid answers.', 40, 80);
    return;
  }

  // Percent scores (already normalized 0–100)
  const bfPct = scored.pct;
  // Raw scores (10–50) for tiebreaking
  const bfRaw = scored.raw;

  // Canonical trait order for final tiebreak: O > C > E > A > ES
  const traitOrder = [
    'Openness',
    'Conscientiousness',
    'Extraversion',
    'Agreeableness',
    'EmotionalStability', // key name from scoreBigFive()
  ];

  // Map pct-key → raw-key for raw-score lookup
  const rawKeyFor = (traitKey) => {
    switch (traitKey) {
      case 'Openness':
        return 'openness';
      case 'Conscientiousness':
        return 'conscientiousness';
      case 'Extraversion':
        return 'extraversion';
      case 'Agreeableness':
        return 'agreeableness';
      case 'EmotionalStability':
        // raw score stored as neuroticism inside scoreBigFive()
        return 'neuroticism';
      default:
        return null;
    }
  };

  // Build sorted list with pct + raw + full tiebreak logic
  const sortedTraits = traitOrder
    .map((key) => {
      const pct = bfPct[key] ?? 0;
      const rawKey = rawKeyFor(key);
      const raw = rawKey ? bfRaw[rawKey] ?? 0 : 0;
      return { key, pct, raw };
    })
    .sort((a, b) => {
      // 1) Higher percentage first
      if (b.pct !== a.pct) return b.pct - a.pct;
      // 2) If tie, higher raw score first
      if (b.raw !== a.raw) return b.raw - a.raw;
      // 3) If still tie, fall back to canonical OCEAS ordering
      return traitOrder.indexOf(a.key) - traitOrder.indexOf(b.key);
    });

    // Adjust percentages so there are no ties in the chart
    for (let i = 1; i < sortedTraits.length; i++) {
      if (sortedTraits[i].pct >= sortedTraits[i - 1].pct) {
        // Nudge this trait down to be 1 point less than the one above it
        sortedTraits[i].pct = Math.max(0, sortedTraits[i - 1].pct - 1);
    }
    }


  // Pretty label for display
  const prettyName = (key) =>
    key === 'EmotionalStability' ? 'Emotional Stability' : key;

  // Top 3 traits after full tie-breaking
  const top1 = prettyName(sortedTraits[0].key);
  const top2 = prettyName(sortedTraits[1].key);
  const top3 = prettyName(sortedTraits[2].key); // (top3 unused for now, but available)

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

  // ----- Title -----
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(TEXT_COLOR);
  doc.text('Big Five Personality Results', pageWidth / 2, 60, {
    align: 'center',
  });

  // ----- Subtitle (two lines) -----
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(
    `Based on the online test you took on ${completionDate},`,
    pageWidth / 2,
    82,
    { align: 'center' }
  );
  doc.text('this is your result scores.', pageWidth / 2, 98, {
    align: 'center',
  });

  // ----- Chart layout -----
  let y = 150;
  const barHeight = 26;
  const gap = 22;
  const left = 40;
  const right = pageWidth - 40;
  const maxBarWidth = right - left;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);

  sortedTraits.forEach(({ key, pct }) => {
    const trait = prettyName(key);
    const width = (pct / 100) * maxBarWidth;

    // Draw bar
    doc.setFillColor(BAR_COLOR);
    doc.roundedRect(left, y, width, barHeight, 6, 6, 'F');

    const textY = y + barHeight / 2 + 4;
    doc.setTextColor(TEXT_COLOR);

    const pctText = `${pct}%`;
    const pctWidth = doc.getTextWidth(pctText);
    const traitWidth = doc.getTextWidth(trait);

    // Decide if bar is long enough to hold both texts
    const neededWidthInside = traitWidth + pctWidth + 40; // padding

    // Always draw trait text inside left
    doc.text(trait, left + 8, textY);

    if (width >= neededWidthInside) {
      // Enough space: both label and percent INSIDE the bar
      doc.text(pctText, left + width - 8 - pctWidth, textY);
    } else {
      // Not enough space: move percent OUTSIDE to the right of the bar
      doc.text(pctText, left + width + 10, textY);
    }

    y += barHeight + gap;
  });

  // ----- Summary text -----
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

// ---------- BASIC NEEDS PAGE LAYOUT (PAGE #3) ----------
function drawBasicNeedsPage(doc, row) {
  const pageWidth = doc.internal.pageSize.getWidth();  // 396 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 612 pt

  const TEXT_COLOR = '#1B2236';
  const BAR_COLOR = '#FFA860';

  const bn = scoreBasicNeeds(row.basicneeds_answers || []);
  if (!bn) {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(TEXT_COLOR);
    doc.text('Basic Needs test not completed or invalid answers.', 40, 80);
    return;
  }

  // Build list with pct + raw for tie-breaking
  let needs = [
    { key: 'Survival', pct: bn.survival_pct, raw: bn.survival },
    { key: 'Love', pct: bn.love_pct, raw: bn.love },
    { key: 'Freedom', pct: bn.freedom_pct, raw: bn.freedom },
    { key: 'Power', pct: bn.power_pct, raw: bn.power },
    { key: 'Fun', pct: bn.fun_pct, raw: bn.fun },
  ];

  // Canonical order for final tie break
  const needOrder = ['Survival', 'Love', 'Freedom', 'Power', 'Fun'];

  // Sort with: pct → raw → canonical order
  needs = needs.sort((a, b) => {
    // 1) Higher percentage first
    if (b.pct !== a.pct) return b.pct - a.pct;
    // 2) If tie, higher raw score first
    if (b.raw !== a.raw) return b.raw - a.raw;
    // 3) If still tie, canonical need order
    return needOrder.indexOf(a.key) - needOrder.indexOf(b.key);
  });

  // Adjust displayed percentages so there are no ties,
  // while staying roughly in the 20–100 range
  if (needs.length > 1) {
    // Step 1: enforce strictly descending
    for (let i = 1; i < needs.length; i++) {
      if (needs[i].pct >= needs[i - 1].pct) {
        needs[i].pct = needs[i - 1].pct - 1;
      }
    }

    // Step 2: if anything dropped below 20, shift everything up together
    let minPct = needs[0].pct;
    for (let i = 1; i < needs.length; i++) {
      if (needs[i].pct < minPct) {
        minPct = needs[i].pct;
      }
    }

    if (minPct < 20) {
      const shift = 20 - minPct;
      for (let i = 0; i < needs.length; i++) {
        needs[i].pct = Math.min(100, needs[i].pct + shift);
      }
    }
  }

  // Top 3 needs after full tie-breaking (in case you want them)
  const top1 = needs[0].key;
  const top2 = needs[1].key;
  const top3 = needs[2]?.key;

  // ----- Title -----
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(TEXT_COLOR);
  doc.text('Basic Needs Results', pageWidth / 2, 60, {
    align: 'center',
  });

  // ----- Subtitle -----
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(
    'Your core psychological needs shown as percentages.',
    pageWidth / 2,
    82,
    { align: 'center' }
  );

  // ----- Chart layout -----
  let y = 150;
  const barHeight = 26;
  const gap = 22;
  const left = 40;
  const right = pageWidth - 40;
  const maxBarWidth = right - left;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);

  needs.forEach(({ key, pct }) => {
    const label = key;
    const width = (pct / 100) * maxBarWidth;

    // Bar
    doc.setFillColor(BAR_COLOR);
    doc.roundedRect(left, y, width, barHeight, 6, 6, 'F');

    const textY = y + barHeight / 2 + 4;
    doc.setTextColor(TEXT_COLOR);

    const pctText = `${pct}%`;
    const pctWidth = doc.getTextWidth(pctText);
    const labelWidth = doc.getTextWidth(label);

    const neededWidthInside = labelWidth + pctWidth + 40; // padding

    // Always draw label text inside bar on the left
    doc.text(label, left + 8, textY);

    if (width >= neededWidthInside) {
      // Enough space: percent inside right
      doc.text(pctText, left + width - 8 - pctWidth, textY);
    } else {
      // Not enough space: percent outside bar to the right
      doc.text(pctText, left + width + 10, textY);
    }

    y += barHeight + gap;
  });

  // ----- Summary -----
  doc.setFontSize(12);
  doc.setTextColor(TEXT_COLOR);
  const summaryLines = [
    `Based on the Basic Needs test, your strongest needs are ${top1} and ${top2}.`,
    'These needs are especially important in how you feel balanced and fulfilled.',
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

// ---------- HEAD PAGE LAYOUT (IMAGE TOP-RIGHT, TEXT WRAPS) ----------
async function drawHeadPage(doc, row) {
    const pageWidth = doc.internal.pageSize.getWidth();   // ~396 pt
    const pageHeight = doc.internal.pageSize.getHeight(); // ~612 pt

    const TEXT_COLOR = '#1B2236';

    const scored = scoreBigFive(row.bigfive_answers || []);
    if (!scored) {
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(TEXT_COLOR);
        doc.text('Big Five test not completed or invalid answers.', 40, 80);
        return;
    }

    const bfPct = scored.pct;
    const bfRaw = scored.raw;

    // Same trait order + tiebreak as Big Five page
    const traitOrder = [
        'Openness',
        'Conscientiousness',
        'Extraversion',
        'Agreeableness',
        'EmotionalStability',
    ];

    const rawKeyFor = (traitKey) => {
        switch (traitKey) {
            case 'Openness':
                return 'openness';
            case 'Conscientiousness':
                return 'conscientiousness';
            case 'Extraversion':
                return 'extraversion';
            case 'Agreeableness':
                return 'agreeableness';
            case 'EmotionalStability':
                return 'neuroticism'; // raw still stored as neuroticism
            default:
                return null;
        }
    };

    const sortedTraits = traitOrder
        .map((key) => {
            const pct = bfPct[key] ?? 0;
            const rawKey = rawKeyFor(key);
            const raw = rawKey ? bfRaw[rawKey] ?? 0 : 0;
            return { key, pct, raw };
        })
        .sort((a, b) => {
            if (b.pct !== a.pct) return b.pct - a.pct;       // 1) higher %
            if (b.raw !== a.raw) return b.raw - a.raw;       // 2) higher raw
            return traitOrder.indexOf(a.key) - traitOrder.indexOf(b.key); // 3) order
        });

    const top1Key = sortedTraits[0].key;
    const top2Key = sortedTraits[1].key;

    const prettyName = (key) =>
        key === 'EmotionalStability' ? 'Emotional Stability' : key;

    const top1Name = prettyName(top1Key);
    const top2Name = prettyName(top2Key);

    const top1Letter = traitKeyToLetter(top1Key);
    const top2Letter = traitKeyToLetter(top2Key);

    const headImagePath = `/booklet/Heads/${top1Letter}${top2Letter}-H.jpg`;

    // ----- Title -----
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(TEXT_COLOR);
    doc.text('Head of Your Sculpture', pageWidth / 2, 60, { align: 'center' });

    // ----- Layout constants -----
    const marginLeft = 40;
    const marginRight = 40;

    const titleBottomY = 60;          // same as title Y
    const imageMaxWidth = 130;        // max width for the head
    const gap = 12;                   // gap between image and text

    const imageX = pageWidth - marginRight - imageMaxWidth;
    const imageY = titleBottomY + 20; // under the title

    // Text widths
    const fullTextWidth = pageWidth - marginLeft - marginRight;
    const narrowTextWidth = imageX - gap - marginLeft; // left of image

    // ----- Load head descriptions from heads.txt -----
    const headDescriptions = await loadHeadDescriptions();
    const headKey = `${top1Letter}${top2Letter}-H`; // e.g. "AO-H"
    const symbolTextsRaw = headDescriptions[headKey] || [];

    let symbolTexts = symbolTextsRaw.slice(0, 3);
    if (symbolTexts.length === 0) {
        symbolTexts = [
            `This head combines shapes and details that reflect your ${top1Name} and ${top2Name} traits.`,
            'It symbolizes how you think, perceive, and emotionally relate to the world.',
        ];
    }

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(TEXT_COLOR);

    const fontSize = doc.getFontSize();
    const lineHeightFactor = 1.3;
    const lineHeight = fontSize * lineHeightFactor;
    const bulletSpacing = 12;

    // ----- Wrap text for bullet 1 (narrow column on the left of the image) -----
    const bullet1Text = `• ${symbolTexts[0]}`;
    const bullet1Lines = doc.splitTextToSize(bullet1Text, narrowTextWidth);

    const bullet1StartY = imageY + 10; // start roughly near top of image

    doc.text(bullet1Lines, marginLeft, bullet1StartY, {
        align: 'left',
        lineHeightFactor,
    });

    const bullet1Height =
        (bullet1Lines.length - 1) * lineHeight; // extra height after first line
    const bullet1BottomY = bullet1StartY + bullet1Height;

    // ----- Prepare bullets 2 & 3 (full width) -----
    const remainingBullets = symbolTexts.slice(1).map((t) => `• ${t}`);

    // Base line to start full-width text = under image OR under bullet 1,
    // whichever is lower, plus some gap
    let fullStartY = Math.max(imageY + imageMaxWidth, bullet1BottomY) + 24;

    // Draw bullets 2 and 3 full width under the image
    remainingBullets.forEach((text) => {
        const lines = doc.splitTextToSize(text, fullTextWidth);
        doc.text(lines, marginLeft, fullStartY, {
            align: 'left',
            lineHeightFactor,
        });
        fullStartY += lines.length * lineHeight + bulletSpacing;
    });

    // ----- Draw image last (so text isn't affected) -----
    try {
        const img = await loadImage(headImagePath);
        // Preserve aspect ratio
        const aspect = img.height / img.width;
        let drawWidth = imageMaxWidth;
        let drawHeight = drawWidth * aspect;

        // If it's ridiculously tall, clamp it (shouldn't happen often)
        const maxImageHeight = pageHeight - imageY - 80;
        if (drawHeight > maxImageHeight) {
            drawHeight = maxImageHeight;
            drawWidth = drawHeight / aspect;
        }

        const adjustedImageX = pageWidth - marginRight - drawWidth;
        doc.addImage(img, 'JPEG', adjustedImageX, imageY, drawWidth, drawHeight);
    } catch (err) {
        // If image missing, just skip it silently
    }
}

// ---------- BODY PAGE LAYOUT (IMAGE TOP-RIGHT, TEXT WRAPS, 4 SYMBOLS) ----------
async function drawBodyPage(doc, row) {
    const pageWidth = doc.internal.pageSize.getWidth();   // ~396 pt
    const pageHeight = doc.internal.pageSize.getHeight(); // ~612 pt

    const TEXT_COLOR = '#1B2236';

    const bn = scoreBasicNeeds(row.basicneeds_answers || []);
    if (!bn) {
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(TEXT_COLOR);
        doc.text('Basic Needs test not completed or invalid answers.', 40, 80);
        return;
    }

    // ---------- Top 2 needs with tiebreak (same logic as your BN chart) ----------
    let needs = [
        { key: 'Survival', pct: bn.survival_pct, raw: bn.survival },
        { key: 'Love', pct: bn.love_pct, raw: bn.love },
        { key: 'Freedom', pct: bn.freedom_pct, raw: bn.freedom },
        { key: 'Power', pct: bn.power_pct, raw: bn.power },
        { key: 'Fun', pct: bn.fun_pct, raw: bn.fun },
    ];

    const needOrder = ['Survival', 'Love', 'Freedom', 'Power', 'Fun'];

    needs = needs.sort((a, b) => {
        if (b.pct !== a.pct) return b.pct - a.pct;      // 1) higher %
        if (b.raw !== a.raw) return b.raw - a.raw;      // 2) higher raw
        return needOrder.indexOf(a.key) - needOrder.indexOf(b.key); // 3) canonical order
    });

    const top1Need = needs[0].key;
    const top2Need = needs[1].key;

    const top1Letter = needKeyToLetter(top1Need);
    const top2Letter = needKeyToLetter(top2Need);

    // e.g. /booklet/Bodies/FL-B.jpg
    const bodyImagePath = `/booklet/Bodies/${top1Letter}${top2Letter}-B.jpg`;

    // ---------- Title ----------
    const titleY = 60;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(TEXT_COLOR);
    doc.text('Body of Your Sculpture', pageWidth / 2, titleY, {
        align: 'center',
    });

    // ---------- Layout constants ----------
    const marginLeft = 40;
    const marginRight = 40;

    const imageMaxWidth = 130;   // target width for body image
    const gap = 12;              // text / image gap

    // Image anchored in top-right corner under the title
    let drawWidth = imageMaxWidth;
    let drawHeight = imageMaxWidth;    // default square approximation
    const imageX = pageWidth - marginRight - drawWidth;
    const imageY = titleY + 30;        // some gap under the title

    // Text widths
    const fullTextWidth = pageWidth - marginLeft - marginRight;
    const narrowTextWidth = imageX - gap - marginLeft; // left of image

    // ---------- Load body descriptions (B1..B4) ----------
    const bodyDescriptions = await loadBodyDescriptions();
    const bodyKey = `${top1Letter}${top2Letter}-B`; // e.g. "FL-B"
    const symbolTextsRaw = bodyDescriptions[bodyKey] || [];

    // We expect 4 symbol descriptions: B1..B4
    let symbolTexts = symbolTextsRaw.slice(0, 4);
    if (symbolTexts.length === 0) {
        symbolTexts = [
            `This body is shaped from your strongest needs: ${top1Need} and ${top2Need}.`,
            'It represents what you need most to feel grounded, safe, and alive.',
        ];
    }

    // ---------- Fonts for body text ----------
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(TEXT_COLOR);

    const fontSize = doc.getFontSize();
    const lineHeightFactor = 1.3;
    const lineHeight = fontSize * lineHeightFactor;
    const bulletSpacing = 12;

    // ---------- Load image (for accurate height) ----------
    let img = null;
    try {
        img = await loadImage(bodyImagePath);
        const aspect = img.height / img.width;
        drawHeight = drawWidth * aspect;

        // Clamp if extremely tall
        const maxImageHeight = pageHeight - imageY - 80;
        if (drawHeight > maxImageHeight) {
            drawHeight = maxImageHeight;
            drawWidth = drawHeight / aspect;
        }
    } catch (err) {
        // If loading fails, img stays null and we keep default square height
    }

    const imageBottomY = imageY + drawHeight;

    // ---------- Bullet 1: narrow column to the left of the image ----------
    const bullet1Text = `• ${symbolTexts[0]}`;
    const bullet1Lines = doc.splitTextToSize(bullet1Text, narrowTextWidth);

    // Start bullet 1 safely below the title but inside the image band
    const safeBelowTitleY = titleY + 24;
    const nearTopOfImageY = imageY + 10;
    const bullet1StartY = Math.max(safeBelowTitleY, nearTopOfImageY);

    doc.text(bullet1Lines, marginLeft, bullet1StartY, {
        align: 'left',
        lineHeightFactor,
    });

    const bullet1Height = (bullet1Lines.length - 1) * lineHeight;
    const bullet1BottomY = bullet1StartY + bullet1Height;

    // ---------- Bullets 2–4: full width below BOTH image and bullet 1 ----------
    const remainingBullets = symbolTexts.slice(1).map((t) => `• ${t}`);

    // Start full-width text below whichever is lower: image OR bullet 1
    let fullStartY = Math.max(imageBottomY, bullet1BottomY) + 24;

    remainingBullets.forEach((text) => {
        const lines = doc.splitTextToSize(text, fullTextWidth);
        doc.text(lines, marginLeft, fullStartY, {
            align: 'left',
            lineHeightFactor,
        });
        fullStartY += lines.length * lineHeight + bulletSpacing;
    });

    // ---------- Draw image last (so text 'flows around' it visually) ----------
    if (img) {
        const adjustedImageX = pageWidth - marginRight - drawWidth;
        doc.addImage(img, 'JPEG', adjustedImageX, imageY, drawWidth, drawHeight);
    }
}

// ---------- LEG PAGE LAYOUT (IMAGE TOP-RIGHT, TEXT WRAPS) ----------
async function drawLegPage(doc, row) {
    const pageWidth = doc.internal.pageSize.getWidth();   // ~396 pt
    const pageHeight = doc.internal.pageSize.getHeight(); // ~612 pt

    const TEXT_COLOR = '#1B2236';

    const scored = scoreBigFive(row.bigfive_answers || []);
    if (!scored) {
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(TEXT_COLOR);
        doc.text('Big Five test not completed or invalid answers.', 40, 80);
        return;
    }

    const bfPct = scored.pct;
    const bfRaw = scored.raw;

    // Same trait order + tiebreak as the Big Five page
    const traitOrder = [
        'Openness',
        'Conscientiousness',
        'Extraversion',
        'Agreeableness',
        'EmotionalStability',
    ];

    const rawKeyFor = (traitKey) => {
        switch (traitKey) {
            case 'Openness':
                return 'openness';
            case 'Conscientiousness':
                return 'conscientiousness';
            case 'Extraversion':
                return 'extraversion';
            case 'Agreeableness':
                return 'agreeableness';
            case 'EmotionalStability':
                return 'neuroticism'; // raw still stored as neuroticism
            default:
                return null;
        }
    };

    const sortedTraits = traitOrder
        .map((key) => {
            const pct = bfPct[key] ?? 0;
            const rawKey = rawKeyFor(key);
            const raw = rawKey ? bfRaw[rawKey] ?? 0 : 0;
            return { key, pct, raw };
        })
        .sort((a, b) => {
            if (b.pct !== a.pct) return b.pct - a.pct;       // 1) higher %
            if (b.raw !== a.raw) return b.raw - a.raw;       // 2) higher raw
            return traitOrder.indexOf(a.key) - traitOrder.indexOf(b.key); // 3) order
        });

    const top1Key = sortedTraits[0].key;
    const top2Key = sortedTraits[1].key;

    const prettyName = (key) =>
        key === 'EmotionalStability' ? 'Emotional Stability' : key;

    const top1Name = prettyName(top1Key);
    const top2Name = prettyName(top2Key);

    const top1Letter = traitKeyToLetter(top1Key); // O/C/E/A/M mapping
    const top2Letter = traitKeyToLetter(top2Key);

    // e.g. /booklet/Legs/AC-L.jpg
    const legImagePath = `/booklet/Legs/${top1Letter}${top2Letter}-L.jpg`;

    // ---------- Title ----------
    const titleY = 60;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(TEXT_COLOR);
    doc.text('Legs of Your Sculpture', pageWidth / 2, titleY, {
        align: 'center',
    });

    // ---------- Layout constants ----------
    const marginLeft = 40;
    const marginRight = 40;

    const imageMaxWidth = 130;   // width target for leg image
    const gap = 12;              // text / image gap

    let drawWidth = imageMaxWidth;
    let drawHeight = imageMaxWidth; // default square approximation
    const imageX = pageWidth - marginRight - drawWidth;
    const imageY = titleY + 30;     // under title with some space

    // Text widths
    const fullTextWidth = pageWidth - marginLeft - marginRight;
    const narrowTextWidth = imageX - gap - marginLeft; // left of image

    // ---------- Load leg symbol descriptions ----------
    const legDescriptions = await loadLegDescriptions();
    const legKey = `${top1Letter}${top2Letter}-L`; // e.g. "AC-L"
    const symbolTextsRaw = legDescriptions[legKey] || [];

    // Legs usually have 3 symbols L1..L3
    let symbolTexts = symbolTextsRaw.slice(0, 3);
    if (symbolTexts.length === 0) {
        symbolTexts = [
            `These legs reflect how your ${top1Name} and ${top2Name} traits show up in your actions and movement through life.`,
            'They describe how you step into new situations and carry your personality into the world.',
        ];
    }

    // ---------- Body text font ----------
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(TEXT_COLOR);

    const fontSize = doc.getFontSize();
    const lineHeightFactor = 1.3;
    const lineHeight = fontSize * lineHeightFactor;
    const bulletSpacing = 12;

    // ---------- Load image to get actual aspect ratio ----------
    let img = null;
    try {
        img = await loadImage(legImagePath);
        const aspect = img.height / img.width;
        drawHeight = drawWidth * aspect;

        const maxImageHeight = pageHeight - imageY - 80;
        if (drawHeight > maxImageHeight) {
            drawHeight = maxImageHeight;
            drawWidth = drawHeight / aspect;
        }
    } catch (err) {
        // If no image, we'll just skip drawing it; drawHeight stays approx square
    }

    const imageBottomY = imageY + drawHeight;

    // ---------- Bullet 1: narrow column to the left of the image ----------
    const bullet1Text = `• ${symbolTexts[0]}`;
    const bullet1Lines = doc.splitTextToSize(bullet1Text, narrowTextWidth);

    // Start bullet 1 safely below title, and inside/near the image band
    const safeBelowTitleY = titleY + 24;
    const nearTopOfImageY = imageY + 10;
    const bullet1StartY = Math.max(safeBelowTitleY, nearTopOfImageY);

    doc.text(bullet1Lines, marginLeft, bullet1StartY, {
        align: 'left',
        lineHeightFactor,
    });

    const bullet1Height = (bullet1Lines.length - 1) * lineHeight;
    const bullet1BottomY = bullet1StartY + bullet1Height;

    // ---------- Bullets 2 & 3: full width below BOTH image and bullet 1 ----------
    const remainingBullets = symbolTexts.slice(1).map((t) => `• ${t}`);

    let fullStartY = Math.max(imageBottomY, bullet1BottomY) + 24;

    remainingBullets.forEach((text) => {
        const lines = doc.splitTextToSize(text, fullTextWidth);
        doc.text(lines, marginLeft, fullStartY, {
            align: 'left',
            lineHeightFactor,
        });
        fullStartY += lines.length * lineHeight + bulletSpacing;
    });

    // ---------- Draw image last (so text appears to flow around it) ----------
    if (img) {
        const adjustedImageX = pageWidth - marginRight - drawWidth;
        doc.addImage(img, 'JPEG', adjustedImageX, imageY, drawWidth, drawHeight);
    }
}


// Helper to load an image from /public for jsPDF
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ---------- BOOKLET PDF GENERATION ----------
const downloadPDF = async (row) => {
  const jsPDFModule = await import('jspdf');
  const { jsPDF } = jsPDFModule;

  // Load cover and back images from /public
  // Make sure these exist: /public/mindmirror_cover.jpg and /public/mindmirror_back.jpg
  const coverImg = await loadImage('/booklet_front.jpg');
  const backImg = await loadImage('/booklet_back.jpg');

  // 5.5" × 8.5" in points (72 pt/inch)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [396, 612],
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const name = safe(row.full_name) !== '—' ? row.full_name : safe(row.email);

  // ---------- PAGE 1: PHOTO COVER ----------
  // Full-bleed cover image
  doc.addImage(coverImg, 'JPEG', 0, 0, pageWidth, pageHeight);

  // (Optional) If you want to overlay text on top of the cover image, uncomment:
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor('#FFFFFF');
  doc.text(`Prepared for: ${name}`, 30, 60);

  // PAGE 2: blank
  doc.addPage();

  // ---------- PAGE 3: BIG FIVE PAGE ----------
  doc.addPage();
  drawBigFivePage(doc, row);

  // ---------- PAGE 4: BASIC NEEDS PAGE ----------
  doc.addPage();
  drawBasicNeedsPage(doc, row);

  // PAGE 5: Head of sculpture
  doc.addPage();
  await drawHeadPage(doc, row);

  // PAGE 6: Body of sculpture
  doc.addPage();
  await drawBodyPage(doc, row);

  // PAGE 7: Legs of sculpture
  doc.addPage();
  await drawLegPage(doc, row);

  // ---------- PAGE 8: BACK COVER (WOOD TEXTURE) ----------
  doc.addPage();
  doc.addImage(backImg, 'JPEG', 0, 0, pageWidth, pageHeight);

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
          (Big Five &amp; Basic Needs charts + cover + back).
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

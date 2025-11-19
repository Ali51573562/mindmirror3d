// pages/admin/results.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/Navbar';

const ADMIN_EMAIL = 'ali51573562@gmail.com';

// Helper to safely render values
const safe = (value) =>
  value === null || value === undefined || value === '' ? '—' : value;

// Helper to load an image from /public for jsPDF
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Helper: convert an SVG in /public to a PNG data URL (for jsPDF addImage)
async function svgToPngDataUrl(svgUrl, width = 300, height = 300) {
    const response = await fetch(svgUrl);
    const svgText = await response.text();

    return new Promise((resolve) => {
        const img = new Image();
        const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            const pngData = canvas.toDataURL("image/png");
            URL.revokeObjectURL(url);
            resolve(pngData);
        };

        img.src = url;
    });
}



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
// ---------- BIG FIVE PAGE LAYOUT — TABLE STYLE (Mockup) ----------
async function drawBigFivePage(doc, row) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const inch = 72;

  const TEXT_COLOR = "#5A3A25"; // MindMirror brown

  const scored = scoreBigFive(row.bigfive_answers || []);
  if (!scored) {
    doc.setFont("Times", "normal");
    doc.setFontSize(14);
    doc.setTextColor(TEXT_COLOR);
    doc.text("Big Five test not completed or invalid answers.", 40, 80);
    return;
  }

  const bfPct = scored.pct;
  const bfRaw = scored.raw;

  const traitOrder = [
    "Agreeableness",
    "Openness",
    "EmotionalStability",
    "Conscientiousness",
    "Extraversion",
  ];

  // Map pct/raw keys
  const pctKey = {
    Agreeableness: "Agreeableness",
    Openness: "Openness",
    EmotionalStability: "EmotionalStability",
    Conscientiousness: "Conscientiousness",
    Extraversion: "Extraversion",
  };
  const rawKey = {
    Agreeableness: "agreeableness",
    Openness: "openness",
    EmotionalStability: "neuroticism",
    Conscientiousness: "conscientiousness",
    Extraversion: "extraversion",
  };

  // Sort by pct → raw, then keep the mockup order for equal values
  const traits = traitOrder
    .map((key) => ({
      key,
      label: key === "EmotionalStability" ? "Emotional Stability" : key,
      pct: bfPct[pctKey[key]] ?? 0,
      raw: bfRaw[rawKey[key]] ?? 0,
    }))
    .sort((a, b) => {
      if (b.pct !== a.pct) return b.pct - a.pct;
      if (b.raw !== a.raw) return b.raw - a.raw;
      return traitOrder.indexOf(a.key) - traitOrder.indexOf(b.key);
    });

  const top1 = traits[0].label;
  const top2 = traits[1].label;

  // ---------- TITLE ----------
  doc.setFont("Times", "normal");
  doc.setFontSize(24);
  doc.setTextColor(TEXT_COLOR);
  doc.text("Big Five Personality", pageWidth / 2, 80, { align: "center" });
  doc.text("Results", pageWidth / 2, 108, { align: "center" });

  // ---------- SUBTITLE ----------
  doc.setFontSize(11.5);
  const subtitle =
    "Based on the Big Five assessment you completed, these are your personality score results.";
  const subtitleLines = doc.splitTextToSize(subtitle, pageWidth - 120);
  doc.text(subtitleLines, pageWidth / 2, 138, {
    align: "center",
  });

  // ---------- TRAIT TABLE ----------
  const leftX = 70;
  const rightX = pageWidth - 70;
  let y = 190;
  const rowGap = 34;

  doc.setFontSize(15);
  traits.forEach((t) => {
    // trait name
    doc.text(t.label, leftX, y);

    // percentage right-aligned
    const pctText = `${t.pct}%`;
    doc.text(pctText, rightX, y, { align: "right" });

    // underline
    const lineY = y + 10;
    doc.setLineWidth(0.6);
    doc.setDrawColor(TEXT_COLOR);
    doc.line(leftX, lineY, rightX, lineY);

    y += rowGap;
  });

  // ---------- DOMINANT TRAITS ----------
  y += 20;
  doc.setFontSize(15);
  doc.text("Your Dominant Traits", pageWidth / 2, y, { align: "center" });

  y += 28;
  doc.setFontSize(18);
  doc.text(`${top1} · ${top2}`, pageWidth / 2, y, { align: "center" });

  // ---------- EXPLANATION PARAGRAPH ----------
  y += 32;
  doc.setFontSize(12.5);

  const para = `Your personality is primarily shaped by ${top1} and ${top2}, which strongly influence how you think, relate, and make decisions.`;
  const paraLines = doc.splitTextToSize(para, pageWidth - 120);

  doc.text(paraLines, pageWidth / 2, y, {
    align: "center",
    lineHeightFactor: 1.4,
  });

  // (Optional) symbol at bottom center – uncomment if you want it:
  // const symbol = await loadImage("/symbol-only.png");
  // if (symbol) {
  //   const symbolSize = 0.4 * inch;
  //   const sx = (pageWidth - symbolSize) / 2;
  //   const sy = pageHeight - 1.1 * inch;
  //   doc.addImage(symbol, "PNG", sx, sy, symbolSize, symbolSize);
  // }
}


// ---------- BASIC NEEDS PAGE LAYOUT — TABLE STYLE ----------
async function drawBasicNeedsPage(doc, row) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const inch = 72;

  const TEXT_COLOR = "#5A3A25"; // MindMirror brown

  const bn = scoreBasicNeeds(row.basicneeds_answers || []);
  if (!bn) {
    doc.setFont("Times", "normal");
    doc.setFontSize(14);
    doc.setTextColor(TEXT_COLOR);
    doc.text("Basic Needs test not completed or invalid answers.", 40, 80);
    return;
  }

  // Build needs list: Survival, Love, Freedom, Power, Fun
  const needOrder = ["Survival", "Love", "Freedom", "Power", "Fun"];

  const needs = needOrder
    .map((key) => {
      switch (key) {
        case "Survival":
          return { key, label: "Survival", pct: bn.survival_pct ?? 0, raw: bn.survival ?? 0 };
        case "Love":
          return { key, label: "Love", pct: bn.love_pct ?? 0, raw: bn.love ?? 0 };
        case "Freedom":
          return { key, label: "Freedom", pct: bn.freedom_pct ?? 0, raw: bn.freedom ?? 0 };
        case "Power":
          return { key, label: "Power", pct: bn.power_pct ?? 0, raw: bn.power ?? 0 };
        case "Fun":
          return { key, label: "Fun", pct: bn.fun_pct ?? 0, raw: bn.fun ?? 0 };
        default:
          return { key, label: key, pct: 0, raw: 0 };
      }
    })
    .sort((a, b) => {
      if (b.pct !== a.pct) return b.pct - a.pct;       // higher percentage first
      if (b.raw !== a.raw) return b.raw - a.raw;       // then higher raw sum
      return needOrder.indexOf(a.key) - needOrder.indexOf(b.key); // then canonical order
    });

  const top1 = needs[0].label;
  const top2 = needs[1].label;

  // ---------- TITLE ----------
  doc.setFont("Times", "normal");
  doc.setFontSize(24);
  doc.setTextColor(TEXT_COLOR);
  doc.text("Basic Needs", pageWidth / 2, 80, { align: "center" });
  doc.text("Results", pageWidth / 2, 108, { align: "center" });

  // ---------- SUBTITLE ----------
  doc.setFontSize(11.5);
  const subtitle =
    "These results show which core psychological needs are most important for your sense of balance and fulfillment.";
  const subtitleLines = doc.splitTextToSize(subtitle, pageWidth - 120);
  doc.text(subtitleLines, pageWidth / 2, 138, {
    align: "center",
  });

  // ---------- NEEDS TABLE ----------
  const leftX = 70;
  const rightX = pageWidth - 70;
  let y = 190;
  const rowGap = 34;

  doc.setFontSize(15);
  doc.setTextColor(TEXT_COLOR);

  needs.forEach((n) => {
    // need name
    doc.text(n.label, leftX, y);

    // percentage right-aligned
    const pctText = `${n.pct}%`;
    doc.text(pctText, rightX, y, { align: "right" });

    // underline
    const lineY = y + 10;
    doc.setLineWidth(0.6);
    doc.setDrawColor(TEXT_COLOR);
    doc.line(leftX, lineY, rightX, lineY);

    y += rowGap;
  });

  // ---------- DOMINANT NEEDS ----------
  y += 20;
  doc.setFontSize(15);
  doc.text("Your Dominant Needs", pageWidth / 2, y, { align: "center" });

  y += 28;
  doc.setFontSize(18);
  doc.text(`${top1} · ${top2}`, pageWidth / 2, y, { align: "center" });

  // ---------- EXPLANATION PARAGRAPH ----------
  y += 32;
  doc.setFontSize(12.5);

  const para = `Your well-being is especially influenced by your needs for ${top1} and ${top2}. When these needs are met, you tend to feel more grounded, motivated, and emotionally balanced.`;
  const paraLines = doc.splitTextToSize(para, pageWidth - 120);

  doc.text(paraLines, pageWidth / 2, y, {
    align: "center",
    lineHeightFactor: 1.4,
  });

  // (Optional) symbol at bottom center – uncomment if you want it:
  // const symbol = await loadImage("/symbol-only.png");
  // if (symbol) {
  //   const symbolSize = 0.4 * inch;
  //   const sx = (pageWidth - symbolSize) / 2;
  //   const sy = pageHeight - 1.1 * inch;
  //   doc.addImage(symbol, "PNG", sx, sy, symbolSize, symbolSize);
  // }
}


// ---------- HEAD PAGE LAYOUT — OPTION 2 (SMART SPLIT AROUND IMAGE, NO STRETCH) ----------
async function drawHeadPage(doc, row) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const inch = 72;

  const TEXT_COLOR = "#5A3A25"; // MindMirror brown

  const scored = scoreBigFive(row.bigfive_answers || []);
  if (!scored) {
    doc.setFont("Times", "normal");
    doc.setFontSize(14);
    doc.setTextColor(TEXT_COLOR);
    doc.text("Big Five test not completed or invalid answers.", 40, 80);
    return;
  }

  const bfPct = scored.pct;
  const bfRaw = scored.raw;

  // Trait order + tie-break (same as other pages)
  const traitOrder = [
    "Openness",
    "Conscientiousness",
    "Extraversion",
    "Agreeableness",
    "EmotionalStability",
  ];

  const rawKeyFor = (traitKey) => {
    switch (traitKey) {
      case "Openness":
        return "openness";
      case "Conscientiousness":
        return "conscientiousness";
      case "Extraversion":
        return "extraversion";
      case "Agreeableness":
        return "agreeableness";
      case "EmotionalStability":
        return "neuroticism";
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
      if (b.pct !== a.pct) return b.pct - a.pct;
      if (b.raw !== a.raw) return b.raw - a.raw;
      return traitOrder.indexOf(a.key) - traitOrder.indexOf(b.key);
    });

  const prettyName = (key) =>
    key === "EmotionalStability" ? "Emotional Stability" : key;

  const top1Key = sortedTraits[0].key;
  const top2Key = sortedTraits[1].key;
  const top1Name = prettyName(top1Key);
  const top2Name = prettyName(top2Key);

  const top1Letter = traitKeyToLetter(top1Key);
  const top2Letter = traitKeyToLetter(top2Key);
  const headImagePath = `/booklet/Heads/${top1Letter}${top2Letter}-H.jpg`;

  // ---------- TITLE ----------
  doc.setFont("Times", "normal");
  doc.setFontSize(24);
  doc.setTextColor(TEXT_COLOR);
  doc.text("Head of Your Sculpture", pageWidth / 2, 80, { align: "center" });

  // ---------- SUBTITLE ----------
  doc.setFontSize(11);
  const subtitle = `Shaped by your ${top1Name} and ${top2Name} traits, this head reflects how you think, perceive, and relate to the world.`;
  const subtitleLines = doc.splitTextToSize(subtitle, pageWidth - 120);
  doc.text(subtitleLines, pageWidth / 2, 112, { align: "center" });

  // ---------- LAYOUT CONSTANTS ----------
  const marginLeft = 60;
  const marginRight = 60;
  const gap = 14;

  // We choose a base width, and compute height from actual image ratio
  const baseImageWidth = 2.1 * inch;
  let imageWidth = baseImageWidth;
  let imageHeight = baseImageWidth; // temporary, updated after we load the image

  // Load image FIRST so we know its real ratio
  let img = null;
  try {
    img = await loadImage(headImagePath);
    const aspect = img.height / img.width; // real aspect ratio
    imageWidth = baseImageWidth;
    imageHeight = baseImageWidth * aspect; // correct height → no stretch
  } catch (err) {
    // if image fails, we just won't draw it; keep default square as fallback
  }

  // Place image in top-right, closer to subtitle
  const imageX = pageWidth - marginRight - imageWidth;
  const imageY = 150; // higher on the page, nearer the subtitle

  const narrowTextWidth = imageX - marginLeft - gap; // column to the left of image
  const fullTextWidth = pageWidth - marginLeft - marginRight;

  const imageBottomY = imageY + imageHeight;

  // ---------- LOAD HEAD DESCRIPTIONS ----------
  const headDescriptions = await loadHeadDescriptions();
  const headKey = `${top1Letter}${top2Letter}-H`; // e.g. "AO-H"
  let symbolTexts = headDescriptions[headKey] || [];

  // Use up to 3 paragraphs
  symbolTexts = symbolTexts.slice(0, 3);
  if (symbolTexts.length === 0) {
    symbolTexts = [
      `This head combines shapes and details that capture your ${top1Name} and ${top2Name} qualities.`,
      "It symbolizes how you think, process experiences, and emotionally orient yourself in the world.",
    ];
  }

  // ---------- TEXT SETUP ----------
  const bodyFontSize = 12.5;
  const lineHeightFactor = 1.4;
  const lineHeight = bodyFontSize * lineHeightFactor;

  doc.setFont("Times", "normal");
  doc.setFontSize(bodyFontSize);
  doc.setTextColor(TEXT_COLOR);

  // ---------- FIRST PARAGRAPH: SMART SPLIT NEXT TO IMAGE ----------
  const firstPara = symbolTexts[0];
  const allFirstLines = doc.splitTextToSize(firstPara, narrowTextWidth);

  const columnTopY = imageY + 4; // starts near top of image band 
  // // how many lines fit roughly in the image height
  const linesToImageBottom = Math.floor(imageHeight / lineHeight);
  
  // allow the text to go at least 1 line below the image
  let maxLinesInColumn = linesToImageBottom + 1;
  
  // never use more lines than we actually have
  maxLinesInColumn = Math.min(maxLinesInColumn, allFirstLines.length);

  const firstLinesInColumn = allFirstLines.slice(0, maxLinesInColumn);
  const overflowLines = allFirstLines.slice(maxLinesInColumn); // goes below image

  // Draw first chunk next to image
  doc.text(firstLinesInColumn, marginLeft, columnTopY, {
    align: "left",
    lineHeightFactor,
  });

  const firstColumnHeight =
    (firstLinesInColumn.length - 1) * lineHeight;
  const firstBottomY = columnTopY + firstColumnHeight;

  // ---------- BUILD PARAGRAPHS FOR FULL-WIDTH AREA ----------
  const remainingParas = symbolTexts.slice(1);
  const belowParagraphs = [];

  if (overflowLines.length > 0) {
    // join overflow lines back into one paragraph for smoother reading
    belowParagraphs.push(overflowLines.join(" "));
  }

  belowParagraphs.push(...remainingParas);

  // starting Y for full-width text = just below the lower of image / first column
  // // We want the continuation to feel like next line of the same paragraph
  // so we start roughly one line below the last column line,
  // but we also make sure we don’t overlap the image if the column ended higher.
  let minStartBelowImage = imageBottomY + lineHeight * 0.3;      // small safety gap
  let continuationStart = firstBottomY + lineHeight;             // like "next line"
  
  let fullStartY = Math.max(continuationStart, minStartBelowImage);
  


  belowParagraphs.forEach((para) => {
    const lines = doc.splitTextToSize(para, fullTextWidth);
    doc.text(lines, marginLeft, fullStartY, {
      align: "left",
      lineHeightFactor,
    });
    fullStartY += lines.length * lineHeight + lineHeight; 
    // or, if you want VERY tight paragraphs:
    // fullStartY += lines.length * lineHeight;

  });

  // ---------- DRAW IMAGE LAST (TOP-RIGHT, NO STRETCH) ----------
  if (img) {
    doc.addImage(img, "JPEG", imageX, imageY, imageWidth, imageHeight);
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


// ---------- THANK YOU PAGE (Draft 13) ----------
async function addThankYouPage(doc, userName) {
    const pageWidth = doc.internal.pageSize.getWidth();   // 396 pt
    const pageHeight = doc.internal.pageSize.getHeight(); // 612 pt

    const inch = 72;
    const leftMargin = 0.9 * inch;
    const rightMargin = 0.9 * inch;
    const usableWidth = pageWidth - leftMargin - rightMargin;

    const TEXT_COLOR = "#5A3A25";
    const BG_COLOR = "#F5EFE6";

    const nameToUse = userName || "Friend";

    // Load PNG logo from /public
    const logoImg = await loadImage("/symbol-only.png");

    // New page
    doc.addPage();

    // Background
    doc.setFillColor(BG_COLOR);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // ---------------------------------------
    // 1. LOGO — slightly larger, centered
    // ---------------------------------------
    const logoSize = 0.8 * inch; // was 0.7", now larger
    const logoX = (pageWidth - logoSize) / 2; // centered
    const logoY = 1.0 * inch;                // keep vertical reference

    if (logoImg) {
        doc.addImage(logoImg, "PNG", logoX, logoY, logoSize, logoSize);
    }

    // ---------------------------------------
    // 2. TITLE ("THANK YOU")
    // ---------------------------------------
    let y = logoY + logoSize + 0.32 * inch; // space under logo

    doc.setFont("Times", "normal");
    doc.setFontSize(26);
    doc.setTextColor(TEXT_COLOR);
    doc.text("THANK YOU", pageWidth / 2, y, { align: "center" });

    // everything under THANK YOU goes a bit lower (+0.14")
    y += 0.38 * inch + 0.14 * inch;

    // ---------------------------------------
    // 3. BODY TEXT
    // ---------------------------------------
    doc.setFont("Times", "normal");
    doc.setFontSize(12.5);

    const body =
        `Dear ${nameToUse},\n\n` +
        "Thank you for being part of the MindMirror3D journey.\n\n" +
        "Your sculpture and booklet were created with care, precision, and deep respect for who you are. " +
        "This is more than a report—it's a reflection of your inner landscape, your strengths, " +
        "and your unique way of moving through the world.\n\n" +
        "We hope this serves as a meaningful guide for self-understanding, connection, and growth.";

    const bodyLineHeight = 17.4; // a bit more open
    const bodyLines = doc.splitTextToSize(body, usableWidth);

    doc.text(bodyLines, leftMargin, y, {
        lineHeightFactor: bodyLineHeight / 12.5,
    });

    y += bodyLines.length * bodyLineHeight;

    // ---------------------------------------
    // 4. CLOSING
    // ---------------------------------------
    // extra breathing space before closing
    y += 40; // slightly more than before

    doc.setFont("Times", "normal");
    doc.setFontSize(12.5);
    doc.text("— MindMirror3D", pageWidth - rightMargin, y, { align: "right" });

    // ---------------------------------------
    // 5. BOTTOM LINE (0.9" from bottom)
    // ---------------------------------------
    const lineY = pageHeight - 0.9 * inch;

    doc.setDrawColor(TEXT_COLOR);
    doc.setLineWidth(1);
    doc.line(leftMargin, lineY, pageWidth - rightMargin, lineY);
}



// ---------- BOOKLET PDF GENERATION ----------
const downloadPDF = async (row) => {
  const jsPDFModule = await import('jspdf');
  const { jsPDF } = jsPDFModule;

  // Load cover and back images from /public
  // Make sure these exist: /public/mindmirror_cover.jpg and /public/mindmirror_back.jpg
  const coverImg = await loadImage('/booklet_front.jpg');
  const backImg = await loadImage('/booklet_back.jpg');
  const symbolImg = await loadImage('/symbol-only.png'); // new: cover symbol
  

  // 5.5" × 8.5" in points (72 pt/inch)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [396, 612],
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const name = safe(row.full_name) !== '—' ? row.full_name : safe(row.email);

  // ---------- PAGE 1: COVER (Draft 5 — Right-Aligned Text + Top-Left Logo) ----------
  // ---------- PAGE 1: SIMPLE COVER (Background + Movable Name) ----------
  // ---------- PAGE 1: SIMPLE COVER (Background + Left-Aligned Name) ----------
  doc.addImage(coverImg, 'JPEG', 0, 0, pageWidth, pageHeight);
  
  // Clean the name
  let coverName = name || "Your MindMirror3D Edition";
  if (coverName.includes('@')) {
    const base = coverName.split('@')[0];
    coverName = base.charAt(0).toUpperCase() + base.slice(1);
  }
  // Append "'s"
  coverName = `${coverName}'s`;

  
  // Appearance
  doc.setFont("Times", "normal");
  doc.setFontSize(28);
  doc.setTextColor("#FFFFFF");
  
  // 👉 You will adjust ONLY these two values:
  const X = pageWidth * 0.11;   // how far from the left the name begins
  const Y = pageHeight * 0.23;  // vertical position
  
  // Draw the name (left-aligned = begins exactly at X)
  doc.text(coverName, X, Y, { align: 'left' });
  
  


  // PAGE 2: blank
  doc.addPage();

  // ---------- PAGE 3: BIG FIVE PAGE ----------
  doc.addPage();
  await drawBigFivePage(doc, row);

  // ---------- PAGE 4: BASIC NEEDS PAGE ----------
  doc.addPage();
  await drawBasicNeedsPage(doc, row);

  // PAGE 5: Head of sculpture
  doc.addPage();
  await drawHeadPage(doc, row);

  // PAGE 6: Body of sculpture
  doc.addPage();
  await drawBodyPage(doc, row);

  // PAGE 7: Legs of sculpture
  doc.addPage();
  await drawLegPage(doc, row);

  //---------- PAGE 8: THANK YOU PAGE ----------
  await addThankYouPage(doc, name);


  // ---------- PAGE 9: BACK COVER (WOOD TEXTURE) ----------
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

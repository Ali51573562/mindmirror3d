// components/ThankYouPDFButton.jsx
"use client"; // safe in Next.js; ignored if you're using the old /pages router

import { jsPDF } from "jspdf";

// Convert SVG file to PNG data URL in the browser
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

export default function ThankYouPDFButton({ userName = "Friend" }) {
    const handleDownload = async () => {
        const pageWidth = 5.5;  // inches
        const pageHeight = 8.5; // inches

        const doc = new jsPDF({
            unit: "in",
            format: [pageWidth, pageHeight],
            orientation: "portrait",
        });

        // ---- Background (cream) ----
        doc.setFillColor("#F5EFE6");
        doc.rect(0, 0, pageWidth, pageHeight, "F");

        // ---- Margins ----
        const left = 0.8;
        const right = 0.8;
        const usableWidth = pageWidth - left - right;

        // ---- Title ----
        let y = 1.1; // top position for title
        doc.setFont("times", "normal");
        doc.setFontSize(24);
        doc.text("Thank You", pageWidth / 2, y, { align: "center" });

        // space after title
        y += 0.4;

        // ---- Greeting line: "Dear {name}," ----
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11.5);
        const greeting = `Dear ${userName},`;
        doc.text(greeting, left, y);
        y += 0.2; // small gap between greeting and body

        // ---- Body text ----
        const body =
            "Thank you for taking the MindMirror3D journey.\n\n" +
            "Your sculpture and booklet were created with care, precision, and deep respect for who you are. " +
            "This is more than a report — it’s a reflection of your inner landscape, your strengths, " +
            "and your unique way of moving through the world.\n\n" +
            "We hope this serves as a meaningful guide for self-understanding, connection, and growth.";

        const bodyLines = doc.splitTextToSize(body, usableWidth);
        doc.text(bodyLines, left, y, { lineHeightFactor: 1.23 });

        // approximate vertical advance based on number of lines
        const approxLineHeight = 0.18; // in inches
        y += bodyLines.length * approxLineHeight;

        // ---- Space between body and closing (~0.32 in) ----
        y += 0.32;

        // ---- Closing text ----
        doc.setFont("times", "normal");
        doc.setFontSize(11);

        const closing = "With appreciation,\nThe MindMirror3D Team";
        const closingLines = doc.splitTextToSize(closing, usableWidth);
        doc.text(closingLines, left, y, { lineHeightFactor: 1.2 });

        // ---- Symbol at bottom (SVG -> PNG) ----
        try {
            const pngDataUrl = await svgToPngDataUrl("/symbol-only.svg", 300, 300);

            const symbolSize = 0.8; // inches (same as in drafts)
            const symbolX = (pageWidth - symbolSize) / 2;
            const symbolY = pageHeight - 1.0; // adjust up/down if you want

            doc.addImage(pngDataUrl, "PNG", symbolX, symbolY, symbolSize, symbolSize);
        } catch (error) {
            console.error("Error loading symbol-only.svg:", error);
            // PDF still generates even if the logo fails
        }

        // ---- Save ----
        doc.save("mindmirror3d-thank-you.pdf");
    };

    return (
        <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 rounded-md bg-amber-700 text-white hover:bg-amber-800"
        >
            Download Thank You Page
        </button>
    );
}

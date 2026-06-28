import { useState, useRef, useEffect } from 'react';
import styles from './DownloadMenu.module.css';

function scoreLabel(score) {
  if (score >= 8)  return 'Excellent';
  if (score >= 6.5)return 'Good';
  if (score >= 4.5)return 'Fair';
  return 'Needs Work';
}

function getDomain(url) {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return 'site'; }
}

// ─── JSON export ─────────────────────────────────────────────────────────────
function exportJSON(results, url, topic) {
  const { parsedContent, geoAudit, competitorData, rewrites, finalReport } = results ?? {};
  const domain = getDomain(url);
  const date   = new Date().toISOString().slice(0, 10);

  const payload = {
    meta: { url, topic, analyzedAt: new Date().toISOString() },
    geoScore: {
      overall: geoAudit?.overall_score ?? null,
      criteria: geoAudit?.criteria ?? {},
      strengths: geoAudit?.strengths ?? [],
      top_weaknesses: geoAudit?.top_weaknesses ?? [],
    },
    contentAnalysis: {
      title: parsedContent?.title,
      wordCount: parsedContent?.wordCount,
      metaDescription: parsedContent?.metaDescription,
      headings: parsedContent?.headings,
      structuralSignals: parsedContent?.structuralSignals,
    },
    competitors: competitorData?.competitors ?? [],
    competitiveLandscape: {
      summary: competitorData?.landscape_summary,
      gap_opportunities: competitorData?.gap_opportunities ?? [],
    },
    rewrites: rewrites?.rewrites ?? [],
    additionalQuickWins: rewrites?.additional_quick_wins ?? [],
    actionPlan: finalReport?.action_plan ?? [],
    executiveSummary: finalReport?.executive_summary ?? '',
    closingInsight: finalReport?.closing_insight ?? '',
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `geo-report-${domain}-${date}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ─── PDF export ──────────────────────────────────────────────────────────────
const PDF_CRITERIA_LABELS = {
  authority:               'Authority & Credibility',
  structural_clarity:      'Structural Clarity',
  quotability:             'Quotability',
  comprehensiveness:       'Comprehensiveness',
  semantic_clarity:        'Semantic Clarity',
  freshness:               'Freshness Signals',
  question_answering:      'Q&A Format',
  evidence_density:        'Evidence Density',
  chunk_quality:           'Chunk Quality',
  question_structure:      'Question-Oriented Structure',
  eeat_authority:          'E-E-A-T & Author Credibility',
  schema_markup:           'Schema & Structured Data',
  fluency_quality:         'Fluency & Content Quality',
  domain_entity_authority: 'Domain Entity Authority',
};

async function exportPDF(results, url, topic, score) {
  const { jsPDF } = await import('jspdf');
  const { geoAudit, competitorData, finalReport } = results ?? {};
  const domain   = getDomain(url);
  const dateStr  = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const datetime = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W      = 210;
  const H      = 297;
  const MARGIN = 18;
  const TW     = W - MARGIN * 2;
  let y        = MARGIN;

  // ── Color palette ──────────────────────────────────────────────────────────
  const BLUE      = [37, 99, 235];
  const BLUE_LITE = [219, 234, 254];   // blue-100
  const DARK      = [17, 24, 39];
  const MID       = [55, 65, 81];
  const GRAY      = [107, 114, 128];
  const LGRAY     = [229, 231, 235];
  const SURFACE   = [249, 250, 251];
  const WHITE     = [255, 255, 255];
  const GREEN     = [22, 163, 74];
  const GREEN_L   = [220, 252, 231];
  const ORANGE    = [234, 88, 12];
  const ORANGE_L  = [255, 237, 213];
  const RED       = [220, 38, 38];
  const RED_L     = [254, 226, 226];

  function scoreRGB(s)  { return s >= 7 ? GREEN  : s >= 5 ? ORANGE  : RED; }
  function scoreLiteRGB(s) { return s >= 7 ? GREEN_L : s >= 5 ? ORANGE_L : RED_L; }
  function scoreLabelStr(s) {
    if (s >= 8) return 'Excellent';
    if (s >= 7) return 'Good';
    if (s >= 5) return 'Fair';
    return 'Needs Work';
  }

  function newPage() { doc.addPage(); y = MARGIN; }
  function checkY(needed = 20) { if (y + needed > H - 22) newPage(); }
  function gap(n = 6) { y += n; }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function sectionHeading(text) {
    checkY(20);
    // Blue left accent bar
    doc.setFillColor(...BLUE);
    doc.rect(MARGIN, y, 3, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    doc.text(text, MARGIN + 7, y + 6.5);
    y += 11;
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, MARGIN + TW, y);
    y += 7;
  }

  function bodyText(text, color = MID, indent = 0, size = 9.5) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, TW - indent);
    checkY(lines.length * 5.2);
    doc.text(lines, MARGIN + indent, y);
    y += lines.length * 5.2 + 2;
  }

  // ── 1. HEADER BANNER ───────────────────────────────────────────────────────
  // Full-width blue banner
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, W, 36, 'F');

  // Brand name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text('citeable', MARGIN, 13);

  // Report subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 180, 255);
  doc.text('GEO AUDIT REPORT', MARGIN, 20);

  // Decorative right side: score teaser
  if (score != null) {
    const sRGB = scoreRGB(score);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(`${score?.toFixed?.(1) ?? score}`, W - MARGIN - 22, 18, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 180, 255);
    doc.text('/10', W - MARGIN - 18, 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 255, 180);
    doc.text(scoreLabelStr(score).toUpperCase(), W - MARGIN, 25, { align: 'right' });
  }

  // Date bottom of banner
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 180, 255);
  doc.text(datetime, W - MARGIN, 32, { align: 'right' });

  y = 44;

  // URL + topic
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...BLUE);
  const urlLines = doc.splitTextToSize(url, TW);
  doc.text(urlLines, MARGIN, y);
  y += urlLines.length * 4.5 + 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MID);
  doc.text(`Topic: ${topic}`, MARGIN, y);
  y += 8;

  doc.setDrawColor(...LGRAY);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + TW, y);
  y += 10;

  // ── 2. EXECUTIVE SUMMARY ───────────────────────────────────────────────────
  if (finalReport?.executive_summary) {
    sectionHeading('Executive Summary');

    const sumLines = doc.splitTextToSize(finalReport.executive_summary, TW - 10);
    const boxH = sumLines.length * 5.2 + 14;
    checkY(boxH + 4);

    // Light blue box with left border
    doc.setFillColor(...BLUE_LITE);
    doc.roundedRect(MARGIN, y, TW, boxH, 3, 3, 'F');
    doc.setFillColor(...BLUE);
    doc.rect(MARGIN, y, 3, boxH, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...MID);
    doc.text(sumLines, MARGIN + 8, y + 8);
    y += boxH + 10;
  }

  // ── 3. GEO SCORE ───────────────────────────────────────────────────────────
  sectionHeading('GEO Score');
  checkY(38);

  const sl     = scoreLabelStr(score);
  const sRGB   = scoreRGB(score);
  const sLiteRGB = scoreLiteRGB(score);

  // Score card background
  doc.setFillColor(...SURFACE);
  doc.roundedRect(MARGIN, y, TW, 30, 3, 3, 'F');
  doc.setDrawColor(...LGRAY);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, TW, 30, 3, 3, 'S');

  // Score number (left side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  doc.setTextColor(...sRGB);
  doc.text(`${score?.toFixed?.(1) ?? score}`, MARGIN + 10, y + 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...GRAY);
  doc.text('/10', MARGIN + 32, y + 21);

  // Label pill (center-left)
  const pillW = 28;
  const pillX = MARGIN + 50;
  doc.setFillColor(...sLiteRGB);
  doc.roundedRect(pillX, y + 10, pillW, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...sRGB);
  doc.text(sl.toUpperCase(), pillX + pillW / 2, y + 15.5, { align: 'center' });

  // Progress bar (right side)
  const barX = MARGIN + 88;
  const barW = TW - 90;
  const barH = 6;
  const barY = y + 12;
  doc.setFillColor(...LGRAY);
  doc.roundedRect(barX, barY, barW, barH, 2, 2, 'F');
  const fillW = barW * Math.min(1, (score ?? 0) / 10);
  doc.setFillColor(...sRGB);
  doc.roundedRect(barX, barY, fillW, barH, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text(`${Math.round((score ?? 0) * 10)}% GEO score`, barX + barW / 2, barY + barH + 5, { align: 'center' });

  y += 38;

  // ── 4. CRITERIA BREAKDOWN ──────────────────────────────────────────────────
  if (geoAudit?.criteria) {
    checkY(24);
    sectionHeading('Criteria Breakdown');

    const C1 = 76;
    const C2 = 22;

    // Table header
    doc.setFillColor(...SURFACE);
    doc.rect(MARGIN, y - 3, TW, 8, 'F');
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.2);
    doc.rect(MARGIN, y - 3, TW, 8, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text('CRITERION',    MARGIN + 3,          y + 2);
    doc.text('SCORE',        MARGIN + C1 + 3,     y + 2);
    doc.text('KEY FINDING',  MARGIN + C1 + C2 + 3, y + 2);
    y += 9;

    let rowAlt = false;
    for (const [key, val] of Object.entries(geoAudit.criteria)) {
      const label    = PDF_CRITERIA_LABELS[key] || key;
      const finding  = (val.evidence || val.explanation || '').substring(0, 130);
      const findLines = doc.splitTextToSize(finding, TW - C1 - C2 - 6);
      const rowH = Math.max(9, findLines.length * 4.3 + 5);
      checkY(rowH + 2);

      if (rowAlt) {
        doc.setFillColor(...SURFACE);
        doc.rect(MARGIN, y - 1, TW, rowH, 'F');
      }
      rowAlt = !rowAlt;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...DARK);
      doc.text(label, MARGIN + 3, y + 4.5);

      const sc  = val.score ?? 0;
      const fc  = scoreRGB(sc);
      const fcL = scoreLiteRGB(sc);
      doc.setFillColor(...fcL);
      doc.roundedRect(MARGIN + C1 + 2, y + 1.5, 16, 5.5, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...fc);
      doc.text(`${sc}/10`, MARGIN + C1 + 10, y + 5.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      doc.setFontSize(7.5);
      doc.text(findLines, MARGIN + C1 + C2 + 3, y + 4.5);

      y += rowH;
      doc.setDrawColor(...LGRAY);
      doc.setLineWidth(0.15);
      doc.line(MARGIN, y, MARGIN + TW, y);
    }
    gap(10);
  }

  // ── 5. TOP WEAKNESSES ──────────────────────────────────────────────────────
  if (geoAudit?.top_weaknesses?.length) {
    checkY(20);
    sectionHeading('Top Weaknesses');

    for (const [i, w] of geoAudit.top_weaknesses.entries()) {
      checkY(24);
      const issueLines = doc.splitTextToSize(w.issue || w.feedback || '', TW - 16);
      const cardH = Math.max(14, issueLines.length * 4.8 + (w.impact ? 12 : 4));

      // Card
      doc.setFillColor(...RED_L);
      doc.roundedRect(MARGIN, y, TW, cardH, 2, 2, 'F');
      doc.setFillColor(...RED);
      doc.rect(MARGIN, y, 3, cardH, 'F');

      // Number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...RED);
      doc.text(`${i + 1}`, MARGIN + 8, y + 7);

      // Issue
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(issueLines, MARGIN + 15, y + 7);

      if (w.impact) {
        const impY = y + issueLines.length * 4.8 + 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...GRAY);
        const impLines = doc.splitTextToSize(`Impact: ${w.impact}`, TW - 18);
        doc.text(impLines, MARGIN + 15, impY);
      }

      y += cardH + 5;
    }
    gap(4);
  }

  // ── 6. ACTION PLAN ─────────────────────────────────────────────────────────
  if (finalReport?.action_plan?.length) {
    checkY(20);
    sectionHeading('Action Plan');

    for (const item of finalReport.action_plan) {
      const effortRGB  = item.effort === 'low' ? GREEN  : item.effort === 'medium' ? ORANGE  : RED;
      const effortLite = item.effort === 'low' ? GREEN_L : item.effort === 'medium' ? ORANGE_L : RED_L;
      const actionLines = doc.splitTextToSize(item.action || '', TW - 34);
      const implLines   = item.implementation
        ? doc.splitTextToSize(item.implementation, TW - 20)
        : [];
      const cardH = Math.max(18, actionLines.length * 5 + (implLines.length > 0 ? implLines.length * 4.5 + 10 : 8));
      checkY(cardH + 6);

      // Card background
      doc.setFillColor(...SURFACE);
      doc.roundedRect(MARGIN, y, TW, cardH, 2, 2, 'F');
      doc.setDrawColor(...LGRAY);
      doc.setLineWidth(0.2);
      doc.roundedRect(MARGIN, y, TW, cardH, 2, 2, 'S');
      // Left effort color
      doc.setFillColor(...effortRGB);
      doc.rect(MARGIN, y, 3, cardH, 'F');

      // Priority number
      doc.setFillColor(...effortLite);
      doc.circle(MARGIN + 10, y + 7, 4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...effortRGB);
      doc.text(`${item.priority}`, MARGIN + 10, y + 8.5, { align: 'center' });

      // Effort badge (top-right)
      if (item.effort) {
        const bw = 22;
        const bx = MARGIN + TW - bw - 3;
        doc.setFillColor(...effortRGB);
        doc.roundedRect(bx, y + 3, bw, 6, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...WHITE);
        doc.text(item.effort.toUpperCase(), bx + bw / 2, y + 7.5, { align: 'center' });
      }

      // Action title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...DARK);
      doc.text(actionLines, MARGIN + 18, y + 8);

      // Implementation
      if (implLines.length > 0) {
        const implY = y + actionLines.length * 5 + 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...GRAY);
        doc.text(implLines, MARGIN + 18, implY);
      }

      y += cardH + 5;
    }
    gap(4);
  }

  // ── 7. COMPETITORS ─────────────────────────────────────────────────────────
  if (competitorData?.competitors?.length) {
    checkY(20);
    sectionHeading('Top AI-Cited Competitors');

    for (const [i, c] of competitorData.competitors.slice(0, 6).entries()) {
      checkY(20);
      const diffLines = c.key_differentiator
        ? doc.splitTextToSize(c.key_differentiator, TW - 50)
        : [];
      const cardH = Math.max(14, diffLines.length * 4.3 + 10);

      doc.setFillColor(...SURFACE);
      doc.roundedRect(MARGIN, y, TW, cardH, 2, 2, 'F');
      doc.setDrawColor(...LGRAY);
      doc.setLineWidth(0.2);
      doc.roundedRect(MARGIN, y, TW, cardH, 2, 2, 'S');

      // Rank
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text(`#${i + 1}`, MARGIN + 5, y + cardH / 2 + 2.5);

      // Domain
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...BLUE);
      doc.text(c.domain, MARGIN + 16, y + 6);

      // Differentiator
      if (diffLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...GRAY);
        doc.text(diffLines, MARGIN + 16, y + 11);
      }

      y += cardH + 4;
    }
    gap(4);
  }

  // ── FOOTER on every page ───────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, H - 14, W - MARGIN, H - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text('citeable — GEO Audit Report', MARGIN, H - 10);
    doc.text(dateStr, W / 2, H - 10, { align: 'center' });
    doc.text(`${p} / ${totalPages}`, W - MARGIN, H - 10, { align: 'right' });
  }

  doc.save(`citeable-geo-report-${domain}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DownloadMenu({ results, url, topic, score }) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(null); // 'pdf' | 'json' | null
  const menuRef = useRef(null);

  useEffect(() => {
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function handlePDF() {
    setLoading('pdf');
    setOpen(false);
    try { await exportPDF(results, url, topic, score); }
    catch (e) { console.error('PDF export failed:', e); }
    finally { setLoading(null); }
  }

  function handleJSON() {
    setLoading('json');
    setOpen(false);
    try { exportJSON(results, url, topic); }
    catch (e) { console.error('JSON export failed:', e); }
    finally { setLoading(null); }
  }

  return (
    <div className={styles.wrap} ref={menuRef}>
      <button
        className={styles.trigger}
        onClick={() => setOpen(o => !o)}
        disabled={!!loading}
        aria-label="Download report"
      >
        {loading ? (
          <span className={styles.spinner} />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        )}
        <span>{loading ? (loading === 'pdf' ? 'Generating PDF…' : 'Exporting…') : 'Download'}</span>
        <svg className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className={styles.menu}>
          <button className={styles.option} onClick={handlePDF}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <div className={styles.optionText}>
              <span className={styles.optionLabel}>PDF Report</span>
              <span className={styles.optionDesc}>Formatted audit document</span>
            </div>
          </button>
          <button className={styles.option} onClick={handleJSON}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
            <div className={styles.optionText}>
              <span className={styles.optionLabel}>JSON Export</span>
              <span className={styles.optionDesc}>Raw structured data</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

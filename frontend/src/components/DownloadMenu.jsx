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
async function exportPDF(results, url, topic, score) {
  const { jsPDF } = await import('jspdf');
  const { geoAudit, competitorData, rewrites, finalReport } = results ?? {};
  const domain = getDomain(url);
  const date   = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; // page width
  const MARGIN = 20;
  const TW = W - MARGIN * 2;
  let y = MARGIN;

  const ACCENT = [0, 153, 187];
  const DARK   = [10, 15, 30];
  const GRAY   = [100, 116, 139];
  const LGRAY  = [226, 232, 240];

  function newPage() {
    doc.addPage();
    y = MARGIN;
  }

  function checkY(needed = 20) {
    if (y + needed > 277) newPage();
  }

  function heading1(text, color = DARK) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...color);
    checkY(12);
    doc.text(text, MARGIN, y);
    y += 10;
  }

  function heading2(text) {
    checkY(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    doc.text(text, MARGIN, y);
    y += 7;
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, y, MARGIN + TW, y);
    y += 5;
  }

  function body(text, indent = 0, color = DARK) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, TW - indent);
    checkY(lines.length * 5 + 2);
    doc.text(lines, MARGIN + indent, y);
    y += lines.length * 5 + 2;
  }

  function small(text, color = GRAY) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, TW);
    checkY(lines.length * 4 + 1);
    doc.text(lines, MARGIN, y);
    y += lines.length * 4 + 1;
  }

  function gap(n = 5) { y += n; }

  // ── Cover ──
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, W, 55, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('GEO Audit Report', MARGIN, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(url, MARGIN, 34);
  doc.text(`Topic: ${topic}`, MARGIN, 41);
  doc.text(`Generated: ${date}`, MARGIN, 48);

  // Score badge
  const sLabel = scoreLabel(score);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(W - 60, 18, 40, 20, 4, 4, 'F');
  doc.setTextColor(...ACCENT);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${score?.toFixed?.(1) ?? score}`, W - 50, 30);
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('GEO Score', W - 50, 34);
  doc.text(sLabel, W - 50, 37);

  y = 68;

  // ── Executive Summary ──
  if (finalReport?.executive_summary) {
    heading2('Executive Summary');
    body(finalReport.executive_summary);
    gap(4);
  }

  // ── GEO Score Breakdown ──
  if (geoAudit?.criteria) {
    heading2('GEO Score Breakdown');
    const LABELS = {
      authority: 'Authority & Credibility',
      structural_clarity: 'Structural Clarity',
      quotability: 'Quotability',
      comprehensiveness: 'Comprehensiveness',
      semantic_clarity: 'Semantic Clarity',
      freshness: 'Freshness Signals',
      question_answering: 'Q&A Format',
    };
    for (const [key, val] of Object.entries(geoAudit.criteria)) {
      checkY(14);
      const label = LABELS[key] || key;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(`${label}  ${val.score}/10`, MARGIN, y);
      // Bar
      const bx = MARGIN + 90;
      const bw = TW - 90;
      doc.setFillColor(...LGRAY);
      doc.rect(bx, y - 3.5, bw, 3, 'F');
      const pct = Math.min(1, val.score / 10);
      const fc = val.score >= 8 ? [0, 229, 153] : val.score >= 6.5 ? [255, 215, 0] : val.score >= 4.5 ? [255, 170, 0] : [255, 68, 102];
      doc.setFillColor(...fc);
      doc.rect(bx, y - 3.5, bw * pct, 3, 'F');
      y += 4;
      if (val.explanation) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        const exLines = doc.splitTextToSize(val.explanation, TW);
        doc.text(exLines.slice(0, 2), MARGIN, y);
        y += Math.min(2, exLines.length) * 3.5 + 3;
      } else {
        y += 4;
      }
    }
    gap(4);
  }

  // ── Competitors ──
  if (competitorData?.competitors?.length) {
    checkY(20);
    heading2('Competitive Landscape');
    if (competitorData.landscape_summary) {
      body(competitorData.landscape_summary, 0, GRAY);
      gap(3);
    }
    for (const c of competitorData.competitors.slice(0, 5)) {
      checkY(18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(c.domain, MARGIN, y);
      y += 5;
      if (c.key_differentiator) body(c.key_differentiator, 4, GRAY);
      if (c.why_ai_cites_it)   body(c.why_ai_cites_it, 4, GRAY);
      y += 2;
    }
    gap(4);
  }

  // ── Rewrites ──
  if (rewrites?.rewrites?.length) {
    checkY(20);
    heading2('Before / After Rewrites');
    for (const r of rewrites.rewrites) {
      checkY(24);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(r.weakness_label || r.weakness_addressed || 'Rewrite', MARGIN, y);
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      doc.text('BEFORE', MARGIN, y);
      y += 3;
      body(r.before, 0, [100, 116, 139]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...ACCENT);
      doc.text('AFTER', MARGIN, y);
      y += 3;
      body(r.after, 0, DARK);
      y += 4;
    }
  }

  // ── Action Plan ──
  if (finalReport?.action_plan?.length) {
    checkY(20);
    heading2('Prioritized Action Plan');
    for (const item of finalReport.action_plan) {
      checkY(18);
      doc.setFillColor(...ACCENT);
      doc.circle(MARGIN + 3, y - 1, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      const aLines = doc.splitTextToSize(item.action, TW - 10);
      doc.text(aLines, MARGIN + 9, y);
      y += aLines.length * 5 + 1;
      if (item.implementation) body(item.implementation, 9, GRAY);
      if (item.effort || item.timeline) {
        small(`Effort: ${item.effort || '—'} · Timeline: ${item.timeline || '—'}`);
      }
      y += 4;
    }
  }

  // ── Closing insight ──
  if (finalReport?.closing_insight) {
    checkY(20);
    gap(4);
    doc.setFillColor(240, 249, 252);
    const ciLines = doc.splitTextToSize(finalReport.closing_insight, TW - 8);
    doc.roundedRect(MARGIN, y - 2, TW, ciLines.length * 5 + 10, 3, 3, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(ciLines, MARGIN + 4, y + 4);
    y += ciLines.length * 5 + 12;
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(`GEO Agent Report · ${date} · Page ${p} of ${totalPages}`, MARGIN, 290);
    doc.text(url, W - MARGIN, 290, { align: 'right' });
  }

  doc.save(`geo-report-${domain}-${new Date().toISOString().slice(0, 10)}.pdf`);
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

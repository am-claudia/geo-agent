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
  const { parsedContent, geoAudit, competitorData, rewrites, finalReport: report } = results ?? {};

  const domain  = getDomain(url);
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const dateISO = now.toISOString().slice(0, 10);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 20, TW = 170;

  // Brand palette
  const DPURPLE = [79, 70, 229];
  const LPURPLE = [238, 242, 255];
  const GREEN   = [16, 185, 129];
  const ORANGE  = [245, 158, 11];
  const RED     = [239, 68, 68];
  const BODY    = [30, 27, 75];
  const MUTED   = [107, 114, 128];
  const WHITE   = [255, 255, 255];
  const LGRAY   = [229, 231, 235];
  const DGRAY   = [55, 65, 81];
  const LRED    = [254, 242, 242];
  const LGREEN  = [240, 253, 244];

  const scoreColor = (s) => s >= 7 ? GREEN : s >= 4 ? ORANGE : RED;

  const CRITERIA_LABELS = {
    evidence_density:        'Evidence Density',
    chunk_quality:           'Chunk Quality',
    fluency_quality:         'Fluency & Content Quality',
    question_structure:      'Question-Oriented Structure',
    eeat_credibility:        'E-E-A-T & Credibility',
    freshness_signals:       'Freshness Signals',
    schema_structured_data:  'Schema & Structured Data',
    domain_entity_authority: 'Domain Entity Authority',
  };

  const wrap = (text, maxW) => doc.splitTextToSize(String(text ?? ''), maxW);

  function sectionBar(text, y) {
    doc.setFillColor(...LPURPLE);
    doc.rect(M, y, TW, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...DPURPLE);
    doc.text(text, M + 4, y + 5.5);
    return y + 13;
  }

  function addFooters(total) {
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      doc.setDrawColor(...LGRAY);
      doc.setLineWidth(0.3);
      doc.line(M, 280, W - M, 280);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text('citeable — GEO Audit Report', M, 284);
      doc.text(dateStr, W / 2, 284, { align: 'center' });
      doc.text(`Page ${p} of ${total}`, W - M, 284, { align: 'right' });
    }
  }

  const sc = score ?? geoAudit?.overall_score ?? 0;
  const rating = scoreLabel(sc);

  // ══════════════════════════════════════════════════════
  // PAGE 1 — Cover / Overview
  // ══════════════════════════════════════════════════════

  // Header bar 40mm
  doc.setFillColor(...DPURPLE);
  doc.rect(0, 0, W, 40, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text('citeable', M, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('GEO AUDIT REPORT', M, 30);
  doc.setFontSize(9);
  doc.text(dateStr, W - M, 18, { align: 'right' });

  // Score hero block
  const heroTop = 44;
  const circX = M + 18;
  const circY = heroTop + 20;
  doc.setFillColor(...DPURPLE);
  doc.circle(circX, circY, 18, 'F');
  const scoreText = typeof sc === 'number' ? sc.toFixed(1) : String(sc);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...WHITE);
  doc.text(scoreText, circX, circY + 3, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('/10', circX, circY + 12, { align: 'center' });

  // Info panel (right of circle)
  const infoX = M + 42;
  let iy = heroTop + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...DPURPLE);
  doc.text(rating.toUpperCase(), infoX, iy);
  iy += 9;
  const urlDisplay = (url?.length ?? 0) > 80 ? url.substring(0, 77) + '...' : (url ?? '');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(urlDisplay, infoX, iy);
  iy += 6;
  const topicLines = wrap(`Topic: ${topic ?? ''}`, TW - 44);
  doc.setTextColor(...BODY);
  doc.text(topicLines, infoX, iy);
  iy += topicLines.length * 5 + 1;
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`Generated: ${dateStr}`, infoX, iy);

  // Executive Summary
  let y = heroTop + 50;
  if (report?.executive_summary) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...DPURPLE);
    doc.text('EXECUTIVE SUMMARY', M, y);
    y += 2;
    doc.setDrawColor(...DPURPLE);
    doc.setLineWidth(0.5);
    doc.line(M, y, M + TW, y);
    y += 6;
    const sumLines = wrap(report.executive_summary, TW);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...BODY);
    doc.text(sumLines, M, y);
    y += sumLines.length * 5 + 4;
  }

  // ══════════════════════════════════════════════════════
  // PAGE 2 — Score Breakdown
  // ══════════════════════════════════════════════════════
  doc.addPage();
  y = M;
  y = sectionBar('CRITERIA SCORE BREAKDOWN', y);

  const LABEL_W    = 55;
  const BADGE_XOFF = LABEL_W + 3;
  const BADGE_W    = 10;
  const BAR_XOFF   = BADGE_XOFF + BADGE_W + 3;
  const BAR_W      = TW - BAR_XOFF - 2;

  for (const key of Object.keys(CRITERIA_LABELS)) {
    const crit      = geoAudit?.criteria?.[key];
    const critScore = crit?.score ?? 0;
    const exLines   = wrap(crit?.explanation ?? crit?.evidence ?? '', TW - 5);
    const rowH      = 9 + exLines.length * 4.5 + 4;
    if (y + rowH > 270) { doc.addPage(); y = M; }

    const sColor = scoreColor(critScore);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BODY);
    doc.text(CRITERIA_LABELS[key], M, y + 5);

    doc.setFillColor(...sColor);
    doc.rect(M + BADGE_XOFF, y + 1, BADGE_W, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text(String(critScore), M + BADGE_XOFF + BADGE_W / 2, y + 5, { align: 'center' });

    doc.setFillColor(229, 231, 235);
    doc.roundedRect(M + BAR_XOFF, y + 2, BAR_W, 3, 1, 1, 'F');
    const fillPx = BAR_W * Math.min(1, Math.max(0, critScore) / 10);
    if (fillPx > 0) {
      doc.setFillColor(...sColor);
      doc.roundedRect(M + BAR_XOFF, y + 2, fillPx, 3, 1, 1, 'F');
    }
    y += 9;

    if (exLines.length) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(exLines, M + 5, y);
      y += exLines.length * 4.5;
    }
    y += 4;
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.2);
    doc.line(M, y, M + TW, y);
    y += 2;
  }

  const domainBonus = geoAudit?.domain_bonus ?? 0;
  if (domainBonus > 0) {
    if (y + 8 > 270) { doc.addPage(); y = M; }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GREEN);
    doc.text(`Domain Authority Bonus: +${domainBonus}`, M, y + 5);
    y += 10;
  }
  if (y + 10 > 270) { doc.addPage(); y = M; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...DPURPLE);
  doc.text(`OVERALL GEO SCORE: ${sc}/10`, M, y + 8);

  // ══════════════════════════════════════════════════════
  // PAGE 3 — Top Weaknesses + Action Plan
  // ══════════════════════════════════════════════════════
  doc.addPage();
  y = M;
  y = sectionBar('TOP WEAKNESSES', y);

  for (const [i, w] of (geoAudit?.top_weaknesses ?? []).slice(0, 3).entries()) {
    const wsColor    = scoreColor(w.score ?? 0);
    const issueLines = wrap(w.issue ?? '', TW - 14);
    const impLines   = w.impact ? wrap(`Impact: ${w.impact}`, TW - 14) : [];
    const blockH     = 9 + issueLines.length * 4.5 + (impLines.length ? impLines.length * 4.5 + 2 : 0) + 4;
    if (y + blockH > 270) { doc.addPage(); y = M; }

    doc.setFillColor(...RED);
    doc.circle(M + 4, y + 5, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.text(String(i + 1), M + 4, y + 6.8, { align: 'center' });

    const wLabel = CRITERIA_LABELS[w.criterion] ?? w.criterion ?? '';
    doc.setTextColor(...BODY);
    doc.text(wLabel, M + 12, y + 5);

    doc.setFillColor(...wsColor);
    doc.rect(M + TW - 12, y, 10, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text(String(w.score ?? 0), M + TW - 7, y + 4, { align: 'center' });
    y += 9;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...DGRAY);
    doc.text(issueLines, M + 12, y);
    y += issueLines.length * 4.5 + 2;

    if (impLines.length) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...MUTED);
      doc.text(impLines, M + 12, y);
      y += impLines.length * 4.5 + 2;
    }
    y += 4;
  }

  y += 8;
  if (y + 20 > 270) { doc.addPage(); y = M; }
  y = sectionBar('PRIORITIZED ACTION PLAN', y);

  for (const action of (report?.action_plan ?? []).slice(0, 5)) {
    const effortColor = action.effort === 'low' ? GREEN : action.effort === 'medium' ? ORANGE : RED;
    const titleLines  = wrap(action.action ?? '', TW - 30);
    const implLines   = action.implementation ? wrap(action.implementation, TW - 14) : [];
    const blockH      = 10 + titleLines.length * 5 + (implLines.length ? implLines.length * 4.5 + 4 : 0) + (action.timeline ? 6 : 0) + 5;
    if (y + blockH > 270) { doc.addPage(); y = M; }

    doc.setFillColor(...effortColor);
    doc.rect(M, y, 8, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text(`P${action.priority ?? ''}`, M + 4, y + 4.5, { align: 'center' });

    doc.setTextColor(...BODY);
    doc.setFontSize(9);
    doc.text(titleLines, M + 12, y + 5);

    if (action.effort) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...effortColor);
      const cap = action.effort.charAt(0).toUpperCase() + action.effort.slice(1);
      doc.text(`Effort: ${cap}`, M + TW, y + 5, { align: 'right' });
    }
    y += Math.max(8, titleLines.length * 5) + 2;

    if (implLines.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text(implLines, M + 12, y);
      y += implLines.length * 4.5 + 2;
    }
    if (action.timeline) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(`Timeline: ${action.timeline}`, M + 12, y);
      y += 5;
    }
    y += 5;
  }

  // ══════════════════════════════════════════════════════
  // PAGE 4 — Competitor Benchmarking
  // ══════════════════════════════════════════════════════
  doc.addPage();
  y = M;
  y = sectionBar('TOP AI-CITED COMPETITORS', y);

  const landscape = competitorData?.landscape_summary ?? '';
  if (landscape) {
    const lsLines = wrap(landscape, TW - 8);
    const lsH = lsLines.length * 4.5 + 8;
    if (y + lsH <= 270) {
      doc.setFillColor(...LPURPLE);
      doc.rect(M, y, TW, lsH, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...BODY);
      doc.text(lsLines, M + 4, y + 6);
      y += lsH + 5;
    }
  }

  for (const [i, comp] of (competitorData?.competitors ?? []).slice(0, 5).entries()) {
    if (y + 25 > 270) { doc.addPage(); y = M; }

    doc.setFillColor(...DPURPLE);
    doc.circle(M + 4, y + 5, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...WHITE);
    doc.text(`#${i + 1}`, M + 4, y + 6.5, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(...DPURPLE);
    doc.text(comp.domain ?? '', M + 12, y + 5);
    y += 9;

    if (comp.title) {
      const tLines = wrap(comp.title, TW - 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...BODY);
      doc.text(tLines, M + 12, y);
      y += tLines.length * 4.5 + 2;
    }
    if (comp.key_differentiator) {
      const dLines = wrap(comp.key_differentiator, TW - 12);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(dLines, M + 12, y);
      y += dLines.length * 4.5 + 2;
    }
    const citations = comp.why_ai_cites_it ?? [];
    if (citations.length) {
      if (y + 8 > 270) { doc.addPage(); y = M; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...BODY);
      doc.text('Why AI cites it:', M + 12, y);
      y += 5;
      for (const bullet of citations) {
        if (y > 270) { doc.addPage(); y = M; }
        const bLines = wrap(`• ${bullet}`, TW - 16);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...MUTED);
        doc.text(bLines, M + 14, y);
        y += bLines.length * 4.5;
      }
      y += 2;
    }
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.3);
    doc.line(M, y, M + TW, y);
    y += 5;
  }

  const gaps = competitorData?.gap_opportunities ?? [];
  if (gaps.length) {
    if (y + 15 > 270) { doc.addPage(); y = M; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...DPURPLE);
    doc.text('GAP OPPORTUNITIES', M, y);
    y += 7;
    for (const gap of gaps) {
      if (y + 6 > 270) { doc.addPage(); y = M; }
      const gLines = wrap(`→ ${gap}`, TW);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...BODY);
      doc.text(gLines, M, y);
      y += gLines.length * 4.5 + 2;
    }
  }

  // ══════════════════════════════════════════════════════
  // PAGE 5 — Content Rewrites
  // ══════════════════════════════════════════════════════
  doc.addPage();
  y = M;
  y = sectionBar('SUGGESTED CONTENT REWRITES', y);

  for (const [i, rw] of (rewrites?.rewrites ?? []).slice(0, 3).entries()) {
    if (y + 40 > 270) { doc.addPage(); y = M; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...DPURPLE);
    const rwTitle = wrap(`Rewrite #${i + 1}: ${rw.weakness_label ?? ''}`, TW);
    doc.text(rwTitle, M, y + 5);
    y += rwTitle.length * 5.5 + 2;

    if (rw.weakness_score != null) {
      const rwColor = scoreColor(rw.weakness_score);
      doc.setFillColor(...rwColor);
      doc.rect(M, y, 10, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...WHITE);
      doc.text(String(rw.weakness_score), M + 5, y + 4, { align: 'center' });
      y += 8;
    }
    if (rw.context) {
      const ctxLines = wrap(`Context: ${rw.context}`, TW);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(ctxLines, M, y);
      y += ctxLines.length * 4.5 + 3;
    }

    // BEFORE panel
    if (rw.before) {
      const bfLines = wrap(rw.before, TW - 24);
      const bfH = Math.max(8, bfLines.length * 4.5 + 6);
      if (y + bfH > 270) { doc.addPage(); y = M; }
      doc.setFillColor(...RED);
      doc.rect(M, y, 20, bfH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...WHITE);
      doc.text('BEFORE', M + 10, y + 5, { align: 'center' });
      doc.setFillColor(...LRED);
      doc.rect(M + 20, y, TW - 20, bfH, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...DGRAY);
      doc.text(bfLines, M + 23, y + 5);
      y += bfH + 3;
    }

    // AFTER panel
    if (rw.after) {
      const afLines = wrap(rw.after, TW - 24);
      const afH = Math.max(8, afLines.length * 4.5 + 6);
      if (y + afH > 270) { doc.addPage(); y = M; }
      doc.setFillColor(...GREEN);
      doc.rect(M, y, 20, afH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...WHITE);
      doc.text('AFTER', M + 10, y + 5, { align: 'center' });
      doc.setFillColor(...LGREEN);
      doc.rect(M + 20, y, TW - 20, afH, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...DGRAY);
      doc.text(afLines, M + 23, y + 5);
      y += afH + 3;
    }

    if (rw.why_better) {
      if (y + 8 > 270) { doc.addPage(); y = M; }
      const whyLines = wrap(`Why it's better: ${rw.why_better}`, TW - 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...BODY);
      doc.text(whyLines, M + 5, y);
      y += whyLines.length * 4.5 + 2;
    }
    if (rw.geo_signals_added?.length) {
      if (y + 6 > 270) { doc.addPage(); y = M; }
      const sigLines = wrap(`GEO signals added: ${rw.geo_signals_added.join(', ')}`, TW - 5);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(sigLines, M + 5, y);
      y += sigLines.length * 4.5 + 2;
    }
    y += 6;
  }

  // Quick Wins table
  const quickWins = rewrites?.additional_quick_wins ?? [];
  if (quickWins.length) {
    if (y + 20 > 270) { doc.addPage(); y = M; }
    y = sectionBar('QUICK WINS', y);

    doc.setFillColor(...LPURPLE);
    doc.rect(M, y, TW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...DPURPLE);
    doc.text('Action', M + 3, y + 5);
    doc.text('Effort', M + 113, y + 5);
    doc.text('Impact', M + 143, y + 5);
    y += 7;

    for (const qw of quickWins) {
      if (y + 7 > 270) { doc.addPage(); y = M; }
      const effortColor = qw.effort === 'high' ? GREEN : qw.effort === 'medium' ? ORANGE : RED;
      const impactColor = qw.impact === 'high' ? GREEN : qw.impact === 'medium' ? ORANGE : RED;
      const qwLines = wrap(qw.action ?? '', 100);
      const rowH = Math.max(7, qwLines.length * 4.5 + 3);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...BODY);
      doc.text(qwLines, M + 3, y + 4.5);

      const eff = (qw.effort ?? '');
      const imp = (qw.impact ?? '');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...effortColor);
      doc.text(eff.charAt(0).toUpperCase() + eff.slice(1), M + 113, y + 4.5);
      doc.setTextColor(...impactColor);
      doc.text(imp.charAt(0).toUpperCase() + imp.slice(1), M + 143, y + 4.5);

      y += rowH;
      doc.setDrawColor(...LGRAY);
      doc.setLineWidth(0.15);
      doc.line(M, y, M + TW, y);
    }
  }

  // ══════════════════════════════════════════════════════
  // PAGE 6 — Closing + Metadata
  // ══════════════════════════════════════════════════════
  doc.addPage();
  y = M;

  if (report?.closing_insight) {
    const ciLines = wrap(report.closing_insight, TW - 16);
    const ciH = ciLines.length * 5 + 14;
    doc.setFillColor(...LPURPLE);
    doc.rect(M, y, TW, ciH, 'F');
    doc.setFillColor(...DPURPLE);
    doc.rect(M, y, 3, ciH, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...BODY);
    doc.text(ciLines, M + 8, y + 9);
    y += ciH + 10;
  }

  const strengths = geoAudit?.strengths ?? [];
  if (strengths.length) {
    if (y + 15 > 270) { doc.addPage(); y = M; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...DPURPLE);
    doc.text('IDENTIFIED STRENGTHS', M, y);
    y += 8;
    for (const strength of strengths) {
      if (y + 6 > 270) { doc.addPage(); y = M; }
      const sLines = wrap(`✓ ${strength}`, TW);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...GREEN);
      doc.text(sLines, M, y);
      y += sLines.length * 4.5 + 2;
    }
  }

  // Footers on all pages
  addFooters(doc.getNumberOfPages());

  doc.save(`citeable-geo-report-${domain}-${dateISO}.pdf`);
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

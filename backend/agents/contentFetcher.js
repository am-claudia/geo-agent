import axios from 'axios';
import { load } from 'cheerio';

// Agent 1 — Content Fetcher & Parser
// Receives a URL, returns clean structured content for the GEO Auditor.

const BOILERPLATE_SELECTORS = [
  'nav', 'header', 'footer', 'aside',
  'script', 'style', 'noscript', 'iframe',
  '.nav', '.header', '.footer', '.sidebar', '.navigation',
  '.ad', '.advertisement', '.cookie-notice', '.popup', '.modal',
  '[class*="nav-"]', '[class*="-nav"]', '[class*="menu"]',
  '[class*="footer"]', '[class*="header"]', '[class*="sidebar"]',
  '[class*="cookie"]', '[class*="banner"]', '[class*="popup"]',
  '[id*="nav"]', '[id*="footer"]', '[id*="header"]', '[id*="sidebar"]',
  '[id*="menu"]', '[id*="cookie"]', '[id*="banner"]',
  '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
  'form[class*="search"]', '.breadcrumb', '.pagination', '.tags',
  '.social-share', '.related-posts', '.comments', '#comments',
];

const CONTENT_SELECTORS = [
  'article', 'main', '[role="main"]',
  '.post-content', '.article-content', '.entry-content',
  '.content', '.page-content', '.blog-content', '.post-body',
  '.article-body', '#content', '#main-content', '.main-content',
  '.story-body', '.body-copy', '.text-content',
];

export async function fetchAndParseContent(url) {
  let html;
  try {
    const response = await axios.get(url, {
      timeout: 20000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
      },
    });
    html = response.data;
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      throw new Error(`Cannot reach ${url} — check the URL is correct and publicly accessible.`);
    }
    if (err.response?.status === 403) {
      throw new Error(`Access denied (403) for ${url}. The site blocks automated access.`);
    }
    if (err.response?.status === 404) {
      throw new Error(`Page not found (404): ${url}`);
    }
    throw new Error(`Failed to fetch ${url}: ${err.message}`);
  }

  const $ = load(html);

  // Strip boilerplate
  $(BOILERPLATE_SELECTORS.join(', ')).remove();

  // Metadata
  const title =
    $('title').text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('h1').first().text().trim() ||
    'No title found';

  const metaDescription =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';

  // Heading structure
  const headings = { h1: [], h2: [], h3: [] };
  $('h1').each((_, el) => { const t = $(el).text().trim(); if (t) headings.h1.push(t); });
  $('h2').each((_, el) => { const t = $(el).text().trim(); if (t) headings.h2.push(t); });
  $('h3').each((_, el) => { const t = $(el).text().trim(); if (t) headings.h3.push(t); });

  // Main content extraction — try specific selectors first
  let mainContent = '';
  for (const selector of CONTENT_SELECTORS) {
    const el = $(selector).first();
    if (el.length) {
      const candidate = el.text().replace(/\s+/g, ' ').trim();
      if (candidate.length > 600) {
        mainContent = candidate;
        break;
      }
    }
  }

  // Fallback: largest <div> by text length
  if (!mainContent || mainContent.length < 300) {
    let maxLen = 0;
    $('div').each((_, el) => {
      const t = $(el).clone().children('div').remove().end().text().replace(/\s+/g, ' ').trim();
      if (t.length > maxLen) { maxLen = t.length; mainContent = t; }
    });
  }

  // Final fallback: full body
  if (!mainContent || mainContent.length < 300) {
    mainContent = $('body').text().replace(/\s+/g, ' ').trim();
  }

  // Strip UI noise strings that survive element-level removal
  const UI_NOISE = [
    /send feedback/gi,
    /was this (page |article |doc )?helpful\??(\s*(yes|no)\s*)*/gi,
    /rate this (page|article|doc|content)/gi,
    /(accept|reject) (all )?cookies?/gi,
    /cookie (settings?|preferences?|notice|consent|policy)/gi,
    /we use cookies[^.]*\./gi,
  ];
  for (const pattern of UI_NOISE) mainContent = mainContent.replace(pattern, '');
  mainContent = mainContent.replace(/\s{2,}/g, ' ').trim();

  // Trim content to start from after the first H1 — drops breadcrumbs and pre-title chrome
  if (headings.h1.length > 0) {
    const h1Pos = mainContent.indexOf(headings.h1[0]);
    if (h1Pos !== -1) {
      mainContent = mainContent.substring(h1Pos + headings.h1[0].length).replace(/^\s+/, '');
    }
  }

  // If aggressive stripping left too little, re-extract from raw HTML without boilerplate filtering
  let usedFallback = false;
  if (mainContent.length < 300) {
    const $raw = load(html);
    mainContent = $raw('p, h1, h2, h3, h4, li').map((_, el) => $raw(el).text().trim()).get().filter(t => t).join('\n');
    usedFallback = true;
  }

  // Word count from full content before truncation so the LLM gets the real figure
  const wordCount = mainContent.split(/\s+/).filter(w => w.length > 1).length;

  // Truncate to 35 000 chars — well within llama-3.3-70b-versatile's 128k context.
  // The fallback handler in groqWithFallback.js will trim further if the 8b model is used.
  const truncated = mainContent.length > 35000;
  if (truncated) mainContent = mainContent.substring(0, 35000) + '\n\n[… content truncated for analysis]';

  // Check for lists, FAQs, structured elements (GEO signals)
  const hasLists = $('ul li, ol li').length > 3;
  const hasFAQ = $('[class*="faq"], [id*="faq"], details, summary').length > 0 ||
                 $('h2, h3').toArray().some(el => /\?/.test($(el).text()));
  const hasSchema = $('script[type="application/ld+json"]').length > 0;

  // Extract schema.org structured data — used by auditor for Schema & Freshness criteria
  const schemaTypes = [];
  let datePublished = null;
  let dateModified = null;
  let schemaAuthor = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      const items = Array.isArray(data) ? data : [data];
      items.forEach(item => {
        if (item['@type']) {
          const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
          schemaTypes.push(...types);
        }
        if (item.datePublished && !datePublished) datePublished = item.datePublished;
        if (item.dateModified && !dateModified) dateModified = item.dateModified;
        if (item.author && !schemaAuthor) {
          schemaAuthor = typeof item.author === 'string' ? item.author : (item.author?.name || null);
        }
      });
    } catch {}
  });

  // Fallback: meta tags for dates and author
  if (!datePublished) {
    datePublished =
      $('meta[property="article:published_time"]').attr('content') ||
      $('meta[name="date"]').attr('content') ||
      $('time[datetime]').first().attr('datetime') || null;
  }
  if (!dateModified) {
    dateModified = $('meta[property="article:modified_time"]').attr('content') || null;
  }
  if (!schemaAuthor) {
    schemaAuthor =
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') || null;
  }

  const questionHeadingCount = [...headings.h2, ...headings.h3].filter(h => h.includes('?')).length;

  console.log(`[ContentFetcher] Content extracted: ${mainContent.length} chars | Title: "${title}" | Fallback used: ${usedFallback}`);

  return {
    url,
    title,
    metaDescription,
    headings,
    wordCount,
    mainContent,
    structuralSignals: {
      hasLists,
      hasFAQ,
      hasSchema,
      schemaTypes,
      datePublished,
      dateModified,
      schemaAuthor,
      questionHeadingCount,
    },
    success: true,
  };
}

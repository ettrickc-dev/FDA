// Fills Form 4-17a (1/2026) from saved answers. Server-side only.
// The template has no fillable fields, so text is drawn at measured positions
// (forms/4-17a_2026-01.map.json). Overflow goes on attachment pages.
import fontkit from '@pdf-lib/fontkit';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { degrees, PDFDocument, rgb } from 'pdf-lib';
import { buildFormModel } from './model.js';

export const FORM_FILES = {
  pdf: 'forms/4-17a_2026-01.pdf',
  map: 'forms/4-17a_2026-01.map.json',
  font: 'forms/fonts/DejaVuSansCondensed.ttf',
  fontBold: 'forms/fonts/DejaVuSansCondensed-Bold.ttf',
};

const TEXT_SIZE = 10;
const MIN_SIZE = 6.5;
const MIN_MONEY_SIZE = 5.5;
const INK = rgb(0.05, 0.1, 0.35); // dark blue, easy to tell apart from the printed form

function findFile(rel) {
  const roots = [
    process.env.LAMBDA_TASK_ROOT, process.cwd(),
    (() => { try { return resolve(dirname(fileURLToPath(import.meta.url)), '../../../..'); } catch { return null; } })(),
  ].filter(Boolean);
  for (const r of roots) {
    const p = join(r, rel);
    if (existsSync(p)) return p;
  }
  throw new Error(`Form file not found: ${rel}`);
}

let cache;
export function loadFormAssets() {
  if (!cache) {
    cache = {
      pdf: readFileSync(findFile(FORM_FILES.pdf)),
      map: JSON.parse(readFileSync(findFile(FORM_FILES.map), 'utf8')),
      font: readFileSync(findFile(FORM_FILES.font)),
      fontBold: readFileSync(findFile(FORM_FILES.fontBold)),
    };
  }
  return cache;
}

// Baseline for text written on a 12pt blank whose text-line top is `top`.
const baseline = (H, top) => H - top - 9.3;

function wrap(font, size, str, width) {
  const words = String(str).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= width) { line = next; continue; }
    if (line) lines.push(line);
    // break very long single words
    let rest = w;
    while (font.widthOfTextAtSize(rest, size) > width) {
      let i = rest.length;
      while (i > 1 && font.widthOfTextAtSize(rest.slice(0, i), size) > width) i--;
      lines.push(rest.slice(0, i));
      rest = rest.slice(i);
    }
    line = rest;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

/**
 * @param {object} answers  decrypted answers keyed by section
 * @param {object} opts     { watermark?: boolean }  (watermark drawn in step 5)
 * @returns {{ bytes: Uint8Array, warnings: string[], pageCount: number, attachmentPages: number }}
 */
export async function fillForm(answers, opts = {}) {
  const assets = loadFormAssets();
  const { map } = assets;
  const model = buildFormModel(answers);
  const doc = await PDFDocument.load(assets.pdf);
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(assets.font, { subset: true });
  const bold = await doc.embedFont(assets.fontBold, { subset: true });
  const pages = doc.getPages();
  const H = map.pageHeight;
  const warnings = [];
  const didNotFit = [];

  // ---- text on blanks ----
  for (const [key, value] of Object.entries(model.text)) {
    const f = map.text[key];
    if (!f) { warnings.push(`No position for field ${key}`); continue; }
    const page = pages[f.p];
    const width = f.x1 - f.x0;
    let size = TEXT_SIZE;
    const w = font.widthOfTextAtSize(value, size);
    // Dollar amounts must never be cut off: allow them to shrink further and run slightly long.
    const min = f.money ? MIN_MONEY_SIZE : MIN_SIZE;
    if (w > width) size = Math.max(min, (TEXT_SIZE * width) / w);
    let out = value;
    if (!f.money && font.widthOfTextAtSize(out, size) > width) {
      // Still too long at the smallest readable size: write what fits + marker, full text on attachment.
      const marker = ' (see att.)';
      while (out.length > 1 && font.widthOfTextAtSize(out + marker, size) > width) out = out.slice(0, -1);
      out = out.trimEnd() + marker;
      didNotFit.push([key, value]);
      warnings.push(`"${key}" was too long for the form; the full entry is on the attachment page.`);
    }
    let x = f.x0;
    if (f.align === 'center') x = f.x0 + (width - font.widthOfTextAtSize(out, size)) / 2;
    page.drawText(out, { x, y: baseline(H, f.top), size, font, color: INK });
  }

  // ---- checkboxes: draw an X inside the box ----
  for (const key of model.checks) {
    const c = map.checks[key];
    if (!c) { warnings.push(`No position for checkbox ${key}`); continue; }
    const page = pages[c.p];
    const cx = (c.x0 + c.x1) / 2;
    const cy = H - c.top - 6.0;
    const r = Math.min(2.9, (c.x1 - c.x0) / 2 - 0.6);
    page.drawLine({ start: { x: cx - r, y: cy - r }, end: { x: cx + r, y: cy + r }, thickness: 1.3, color: INK });
    page.drawLine({ start: { x: cx - r, y: cy + r }, end: { x: cx + r, y: cy - r }, thickness: 1.3, color: INK });
  }

  // ---- circle Petitioner / Respondent ----
  for (const key of model.circles) {
    const c = map.circles[key];
    const page = pages[c.p];
    page.drawEllipse({
      x: (c.x0 + c.x1) / 2, y: H - c.top - 6.6,
      xScale: (c.x1 - c.x0) / 2 + 1.2, yScale: 7.4,
      borderColor: INK, borderWidth: 1.1,
    });
  }

  // ---- attachment pages ----
  const sections = [...model.attach];
  if (didNotFit.length) {
    sections.push({ title: 'Full text of entries that did not fit on the form', columns: ['Form line', 'Entry'],
      rows: didNotFit.map(([k, v]) => [LINE_NAMES[k] || k, v]) });
  }
  let attachmentPages = 0;
  if (sections.length) {
    for (const key of model.seeAttached) {
      const s = map.seeAttached[key];
      if (s) pages[s.p].drawText('(see attached page)', { x: s.x, y: baseline(H, s.top) + 0.5, size: 8, font, color: INK });
    }
    attachmentPages = drawAttachments(doc, sections, answers, { font, bold, map });
  }

  if (opts.watermark) drawWatermark(doc, bold);

  const bytes = await doc.save({ useObjectStreams: true });
  return { bytes, warnings, pageCount: doc.getPageCount(), attachmentPages };
}

const LINE_NAMES = {
  name: 'Name', address: 'Residing at', employer: 'Employer', employer_address: 'Employer address',
  file_no: 'File #', docket_no: 'Docket #', court_date: 'Court date, time, and part',
  plan_name: 'Insurance plan name', policy_no: 'Policy #', children_other: "Children's coverage — Other",
  cc_provider: 'Child care provider', home_address: 'House/Apt owned — address', printed_name: 'Print or type name',
  support_to_whom: 'Other support order — to whom', support_amount: 'Other support order — how much',
  oi1_source: 'Other income line 1 — source', oi2_source: 'Other income line 2 — source', oi3_source: 'Other income line 3 — source',
  oa1_details: 'Other asset 1 — details', oa2_details: 'Other asset 2 — details',
  debt1_owed_to: 'Debt 1 — owed to', debt1_for: 'Debt 1 — for', debt2_owed_to: 'Debt 2 — owed to', debt2_for: 'Debt 2 — for',
  savings_bank: 'Savings — bank name', checking_bank: 'Checking — bank name',
  auto_make: 'Automobile — make', auto_model: 'Automobile — model',
};

function drawAttachments(doc, sections, answers, { font, bold, map }) {
  const W = 612, H = 792, M = 54;
  const ci = answers.case_info || {};
  const pagesAdded = [];
  let page, y;

  const newPage = () => {
    page = doc.addPage([W, H]);
    pagesAdded.push(page);
    y = H - M;
    page.drawText(`Attachment to Form 4-17a (${map.revision}) — Financial Disclosure Affirmation (Short Form)`, { x: M, y, size: 11, font: bold });
    y -= 18;
    const idLine = [
      ci.full_name ? `Name: ${ci.full_name}` : null,
      ci.docket_no ? `Docket #: ${ci.docket_no}` : null,
      ci.file_no ? `File #: ${ci.file_no}` : null,
    ].filter(Boolean).join('     ');
    if (idLine) { page.drawText(idLine, { x: M, y, size: 10, font }); y -= 16; }
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.6, color: rgb(0.4, 0.4, 0.4) });
    y -= 20;
  };
  const ensure = (h) => { if (y - h < M + 40) newPage(); };

  newPage();
  for (const s of sections) {
    ensure(40);
    page.drawText(s.title, { x: M, y, size: 11, font: bold });
    y -= 16;
    const usable = W - 2 * M;
    const n = s.columns.length;
    const widths = n === 2 ? [usable * 0.3, usable * 0.7]
      : n === 3 ? [usable * 0.22, usable * 0.53, usable * 0.25]
        : [usable * 0.3, usable * 0.3, usable * 0.2, usable * 0.2];
    const drawRow = (cells, f) => {
      const wrapped = cells.map((c, i) => wrap(f, 9.5, c || '', widths[i] - 8));
      const h = Math.max(...wrapped.map((l) => l.length)) * 12 + 4;
      ensure(h);
      let x = M;
      wrapped.forEach((lines, i) => {
        lines.forEach((ln, j) => page.drawText(ln, { x: x + 2, y: y - j * 12, size: 9.5, font: f, color: f === font ? INK : undefined }));
        x += widths[i];
      });
      y -= h;
      page.drawLine({ start: { x: M, y: y + 8 }, end: { x: W - M, y: y + 8 }, thickness: 0.3, color: rgb(0.7, 0.7, 0.7) });
    };
    drawRow(s.columns, bold);
    for (const r of s.rows) drawRow(r, font);
    y -= 14;
  }

  const total = pagesAdded.length;
  pagesAdded.forEach((p, i) => {
    p.drawText('This attachment is part of my Financial Disclosure Affirmation.', { x: M, y: M + 14, size: 9, font });
    p.drawText('Initials: ____________', { x: W - M - 120, y: M + 14, size: 9, font });
    p.drawText(`Attachment page ${i + 1} of ${total}`, { x: M, y: M - 2, size: 8, font });
  });
  return total;
}

function drawWatermark(doc, bold) {
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    for (const dy of [-220, 0, 220]) {
      page.drawText('DRAFT', {
        x: width / 2 - 170, y: height / 2 - 60 + dy, size: 120, font: bold,
        color: rgb(0.75, 0.1, 0.1), opacity: 0.18, rotate: degrees(35),
      });
    }
    page.drawText('DRAFT — NOT FOR FILING', { x: 36, y: 14, size: 9, font: bold, color: rgb(0.75, 0.1, 0.1) });
  }
}

// Turns a (watermarked) PDF into page images, so the preview that leaves the server has
// no selectable text and no removable watermark objects (spec Section 10.3).
// Uses PDFium compiled to WebAssembly (no native binaries) and pure-JS PNG encoding.
import { PDFiumLibrary } from '@hyzyla/pdfium';
import { PNG } from 'pngjs';

let libPromise;
const lib = () => (libPromise ||= PDFiumLibrary.init());

function toPng({ width, height, data }) {
  // Grayscale keeps files small; the preview is for checking answers, not for printing.
  const png = new PNG({ width, height, colorType: 0, inputColorType: 0, inputHasAlpha: false });
  const gray = Buffer.alloc(width * height);
  if (data.length === width * height) gray.set(data);
  else for (let i = 0, j = 0; j < gray.length; i += 4, j++) gray[j] = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11) | 0;
  png.data = gray;
  return PNG.sync.write(png, { colorType: 0, inputColorType: 0, inputHasAlpha: false, deflateLevel: 7 });
}

/**
 * @param {Uint8Array} pdfBytes
 * @param {{ dpi?: number }} opts  default 110 dpi: readable on a phone when zoomed, poor for printing
 * @returns {Promise<{ width:number, height:number, png: Buffer }[]>}
 */
export async function rasterize(pdfBytes, { dpi = 110 } = {}) {
  const pdfium = await lib();
  const doc = await pdfium.loadDocument(pdfBytes);
  try {
    const out = [];
    for (const page of doc.pages()) {
      const img = await page.render({ scale: dpi / 72, colorSpace: 'Gray', render: 'bitmap' });
      out.push({ width: img.width, height: img.height, png: toPng(img) });
    }
    return out;
  } finally {
    doc.destroy();
  }
}

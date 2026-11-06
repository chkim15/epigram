import { inflateRawSync } from 'node:zlib';

export const CV_MAX_BYTES = 5 * 1024 * 1024;

export type CvFileKind = 'pdf' | 'docx';

/** Identify a CV by its first bytes, not its name or the browser's claimed type. */
export function detectCvKind(bytes: Uint8Array): CvFileKind | null {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'pdf'; // %PDF
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) return 'docx'; // PK zip
  return null;
}

export async function extractCvText(bytes: Uint8Array, kind: CvFileKind): Promise<string> {
  const text = kind === 'pdf' ? await pdfText(bytes) : docxText(bytes);
  return text.replace(/[ \t ]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}

async function pdfText(bytes: Uint8Array): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  // Run pdf.js's worker code in-process (there is no separate worker thread on the server).
  await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(bytes), // pdf.js takes ownership of the buffer
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: false,
  }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= Math.min(doc.numPages, 10); i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let line = '';
    const lines: string[] = [];
    for (const item of content.items) {
      if (!('str' in item)) continue;
      line += item.str;
      if (item.hasEOL) {
        lines.push(line);
        line = '';
      } else if (item.str && !item.str.endsWith(' ')) {
        line += ' ';
      }
    }
    if (line) lines.push(line);
    pages.push(lines.join('\n'));
  }
  await doc.destroy();
  return pages.join('\n');
}

/** A .docx is a zip archive; the text lives in word/document.xml. */
function docxText(bytes: Uint8Array): string {
  const buf = Buffer.from(bytes);
  // End of central directory record: last occurrence of 0x06054b50
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a valid Word file');
  const entries = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < entries && p + 46 <= buf.length; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    if (name === 'word/document.xml') {
      const localNameLen = buf.readUInt16LE(localOffset + 26);
      const localExtraLen = buf.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + localNameLen + localExtraLen;
      const data = buf.subarray(start, start + compSize);
      const xml = (method === 8 ? inflateRawSync(data) : data).toString('utf8');
      return xml
        .replace(/<w:tab\/>/g, ' ')
        .replace(/<\/w:p>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error('No document text found in the Word file');
}

/** Remove direct contact details before the text leaves our servers for the AI model. */
export function redactContactDetails(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[email]')
    .replace(/(\+?\d[\d\s().-]{7,}\d)/g, (m) => (m.replace(/\D/g, '').length >= 9 ? '[phone]' : m));
}

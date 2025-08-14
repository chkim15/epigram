/**
 * Utility functions for handling PDF files from Supabase storage
 */

/**
 * Constructs a PDF URL from Supabase storage
 * @param folderPath - The folder path within the pdf-notes bucket
 * @param pdfName - The PDF filename
 * @returns The full URL to the PDF in Supabase storage
 */
export function getPDFUrl(folderPath: string, pdfName: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  
  return `${supabaseUrl}/storage/v1/object/public/pdf-notes/${folderPath}/${pdfName}`;
}

/**
 * Constructs a PDF URL for topic-related notes
 * @param topicId - The topic ID
 * @param pdfName - The PDF filename (optional, defaults to 'notes.pdf')
 * @returns The full URL to the topic's PDF notes
 */
export function getTopicPDFUrl(topicId: number, pdfName: string = 'notes.pdf'): string {
  return getPDFUrl(`topics/topic-${topicId}`, pdfName);
}

/**
 * Constructs a PDF URL for sample/test PDFs
 * @param pdfName - The PDF filename
 * @returns The full URL to the sample PDF
 */
export function getSamplePDFUrl(pdfName: string): string {
  return getPDFUrl('samples', pdfName);
}

/**
 * Validates if a URL is a valid PDF URL
 * @param url - The URL to validate
 * @returns True if the URL appears to be a valid PDF URL
 */
export function isValidPDFUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.toLowerCase().endsWith('.pdf');
  } catch {
    return false;
  }
}
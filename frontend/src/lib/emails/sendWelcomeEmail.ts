import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { welcomeHtml } from './welcome';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, fullName?: string): Promise<void> {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: blob1, error: err1 }, { data: blob2, error: err2 }] = await Promise.all([
    supabaseAdmin.storage.from('cheatsheets').download('Epigram_Coding_Patterns_Cheatsheet.pdf'),
    supabaseAdmin.storage.from('cheatsheets').download('Epigram_Quant_Interview_Cheatsheet.pdf'),
  ]);

  if (err1 || err2 || !blob1 || !blob2) {
    throw new Error(`Failed to download cheatsheets: ${err1?.message ?? err2?.message}`);
  }

  const [pdf1, pdf2] = await Promise.all([blob1.arrayBuffer(), blob2.arrayBuffer()]);

  const { error } = await resend.emails.send({
    from: 'Epigram <info@epi-gram.app>',
    to: [email],
    subject: 'Welcome to Epigram — your free cheatsheets inside',
    html: welcomeHtml(fullName || 'there'),
    attachments: [
      { filename: 'Epigram_Coding_Patterns_Cheatsheet.pdf', content: Buffer.from(pdf1) },
      { filename: 'Epigram_Quant_Interview_Cheatsheet.pdf', content: Buffer.from(pdf2) },
    ],
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

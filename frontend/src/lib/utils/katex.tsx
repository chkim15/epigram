import katex from 'katex';
import 'katex/dist/katex.min.css';
import React from 'react';

export function renderMath(text: string, documentId?: string): string {
  if (!text) return '';

  // Process line breaks first (convert \\\\ to <br>)
  let processed = text.replace(/\\\\\\\\/g, '<br>');
  processed = processed.replace(/\\\\/g, '<br>');

  // Process images ![filename.png|size%] or ![filename.png]
  processed = processed.replace(/!\[([^\|\]]+)(?:\|([^\]]+))?\]/g, (match, imageName, size) => {
    if (!documentId) return match;
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const imageUrl = `${supabaseUrl}/storage/v1/object/public/math-problems/${documentId}/images/${imageName}`;
    
    let style = 'max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);';
    if (size) {
      // Handle percentage sizes like |30%|
      const percentage = size.replace('%', '');
      if (!isNaN(Number(percentage))) {
        style = `width: ${percentage}%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);`;
      }
    }
    
    return `<div style="text-align: center; margin: 15px 0;">
      <img src="${imageUrl}" alt="${imageName}" style="${style}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
      <div style="display: none; color: #666; font-style: italic; padding: 10px;">Image not found: ${imageName}</div>
    </div>`;
  });

  // Process display math first ($$...$$)
  processed = processed.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
    try {
      return katex.renderToString(math.trim(), {
        throwOnError: false,
        displayMode: true,
        trust: true,
      });
    } catch (e) {
      console.error('KaTeX error (display):', e);
      return match;
    }
  });

  // Process inline math ($...$)
  processed = processed.replace(/\$([^$]+)\$/g, (match, math) => {
    try {
      return katex.renderToString(math.trim(), {
        throwOnError: false,
        displayMode: false,
        trust: true,
      });
    } catch (e) {
      console.error('KaTeX error (inline):', e);
      return match;
    }
  });

  // Process LaTeX environments without delimiters
  const environments = [
    'align', 'align*', 'aligned', 
    'equation', 'equation*',
    'gather', 'gather*',
    'cases', 'matrix', 'pmatrix', 'bmatrix', 'vmatrix', 'Vmatrix'
  ];
  
  const envRegex = new RegExp(
    `\\\\begin\\{(${environments.join('|')})\\}([\\s\\S]*?)\\\\end\\{\\1\\}`,
    'g'
  );

  processed = processed.replace(envRegex, (match, env, content) => {
    try {
      return katex.renderToString(`\\begin{${env}}${content}\\end{${env}}`, {
        throwOnError: false,
        displayMode: true,
        trust: true,
      });
    } catch (e) {
      console.error('KaTeX error (environment):', e);
      return match;
    }
  });

  return processed;
}

export function MathContent({ content, documentId }: { content: string; documentId?: string }) {
  const renderedHTML = renderMath(content, documentId);
  
  return (
    <div 
      className="math-content"
      dangerouslySetInnerHTML={{ __html: renderedHTML }}
    />
  );
}
import katex from 'katex';
import 'katex/dist/katex.min.css';
import React from 'react';

export function renderMath(text: string, documentId?: string): string {
  if (!text) return '';
  
  // Start with a clean copy of the text
  let processed = text;

  // Process line breaks first (convert \\\\ to <br>)
  processed = processed.replace(/\\\\\\\\/g, '<br>'); // Convert \\\\ to <br>
  processed = processed.replace(/\\\\\\\\\\\\\\\\/g, '<br>'); // Convert \\\\\\\\ to <br>
  processed = processed.replace(/\\\\/g, '<br>'); // Convert \\ to <br>

  // Process markdown headers ### text
  processed = processed.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  processed = processed.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  processed = processed.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Handle markdown lists before processing bold text
  // Convert bullet points (* at the start of a line or after line break)
  // Handle both "* text" and "*text" formats
  processed = processed.replace(/^\*\s*(.+)$/gm, '<li>$1</li>');
  
  // Convert numbered lists (1. 2. etc at the start of a line)
  processed = processed.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  
  // Wrap consecutive list items in ul/ol tags
  let lines = processed.split('\n');
  let inList = false;
  let listType = '';
  let result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('<li>')) {
      if (!inList) {
        // Check if it's from a numbered list by looking at original text pattern
        const isNumbered = /^\d+\./.test(lines[i].replace('<li>', ''));
        listType = isNumbered ? 'ol' : 'ul';
        result.push(`<${listType}>`);
        inList = true;
      }
      result.push(line);
    } else {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }
      result.push(line);
    }
  }
  if (inList) {
    result.push(`</${listType}>`);
  }
  processed = result.join('\n');

  // Handle bold/italic text markdown
  // **text** for bold
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // *text* for italic/emphasis (but not at line start to avoid conflict with bullets)
  // Use negative lookbehind to ensure * is not at the start of a line
  processed = processed.replace(/(?<!^|\n)\*([^*\n]+)\*/g, '<em>$1</em>');

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

  // Handle infinity symbol (∞) - convert to \infty
  processed = processed.replace(/∞/g, () => {
    try {
      return katex.renderToString('\\infty', {
        throwOnError: false,
        displayMode: false,
        trust: true,
      });
    } catch (e) {
      return '∞';
    }
  });

  // Process display math first - $$...$$
  processed = processed.replace(/\$\$([^$]+?)\$\$/g, (match, math) => {
    try {
      return katex.renderToString(math.trim(), {
        throwOnError: false,
        displayMode: true,
        trust: true,
      });
    } catch (e) {
      console.error('KaTeX error (display $$):', e);
      return match;
    }
  });

  // Process display math \[...\]
  processed = processed.replace(/\\\[([^\]]*?)\\\]/g, (match, math) => {
    try {
      return katex.renderToString(math.trim(), {
        throwOnError: false,
        displayMode: true,
        trust: true,
      });
    } catch (e) {
      console.error('KaTeX error (display \\[\\]):', e);
      return match;
    }
  });

  // Process inline math \(...\) - simple version first
  processed = processed.replace(/\\\(([^)]*?)\\\)/g, (match, math) => {
    try {
      return katex.renderToString(math.trim(), {
        throwOnError: false,
        displayMode: false,
        trust: true,
      });
    } catch (e) {
      console.error('KaTeX error (inline \\(\\)):', e, 'Math content:', math);
      return match;
    }
  });

  // Process inline math ($...$)
  processed = processed.replace(/\$([^$]+?)\$/g, (match, math) => {
    try {
      return katex.renderToString(math.trim(), {
        throwOnError: false,
        displayMode: false,
        trust: true,
      });
    } catch (e) {
      console.error('KaTeX error (inline $):', e);
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
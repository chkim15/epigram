import katex from 'katex';
import 'katex/dist/katex.min.css';
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { GraphData } from '@/components/ai/GraphRenderer';

// Dynamically import GraphRenderer to avoid SSR issues
const GraphRenderer = dynamic(
  () => import('@/components/ai/GraphRenderer').then(mod => ({ default: mod.GraphRenderer })),
  { 
    ssr: false,
    loading: () => <div className="h-[300px] flex items-center justify-center text-gray-400">Loading graph...</div>
  }
);

export function renderMath(text: string, documentId?: string): string {
  if (!text) return '';
  
  // Start with a clean copy of the text
  let processed = text;
  
  // First, decode HTML entities like &gt; to > (only in browser context)
  if (typeof document !== 'undefined') {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = processed;
    processed = tempDiv.textContent || tempDiv.innerText || '';
  } else {
    // Simple server-side fallback for common entities
    processed = processed.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
  }

  // IMPORTANT: Process math FIRST before handling line breaks, 
  // otherwise we'll break LaTeX array/matrix environments that use \\
  
  // Process display math first - $$...$$ (including multi-line content)
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
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
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match, math) => {
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

  // Process inline math \(...\) - handle multi-line content
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match, math) => {
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

  // Process inline math ($...$) - but be careful with escaped dollar signs
  // First protect escaped dollar signs \$ by temporarily replacing them
  processed = processed.replace(/\\\$/g, '___ESCAPED_DOLLAR___');
  
  // Now process math between single dollar signs
  // Use a more careful regex that doesn't match across multiple dollar signs
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (match, math) => {
    // Check if this contains escaped dollar signs
    if (math.includes('___ESCAPED_DOLLAR___')) {
      // This is not a math expression, it's literal text with dollar signs
      // Just return the content without the outer $ delimiters and restore escaped dollars
      return math.replace(/___ESCAPED_DOLLAR___/g, '$');
    }
    
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
  
  // Restore any remaining escaped dollar signs as literal $ (without the backslash)
  processed = processed.replace(/___ESCAPED_DOLLAR___/g, '$');

  // NOW process text formatting and line breaks (after math is done)
  
  // Process common LaTeX text commands that might appear outside math mode
  // Handle \textbf{...}, \textit{...}, \emph{...}, etc.
  processed = processed.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>');
  processed = processed.replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>');
  processed = processed.replace(/\\emph\{([^}]+)\}/g, '<em>$1</em>');
  processed = processed.replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>');
  processed = processed.replace(/\\text\{([^}]+)\}/g, '$1'); // Plain \text{...}

  // Process LaTeX list environments
  // Handle itemize environment (bulleted list)
  processed = processed.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (match, content) => {
    // Split by \item and filter out empty items
    const items = content.split(/\\item\s*/).filter(item => item.trim())
      .map(item => `<li>${item.trim()}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Handle enumerate environment (numbered list)
  processed = processed.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (match, content) => {
    // Split by \item and filter out empty items
    const items = content.split(/\\item\s*/).filter(item => item.trim())
      .map(item => `<li>${item.trim()}</li>`).join('');
    return `<ol>${items}</ol>`;
  });
  
  // Handle LaTeX spacing and paragraph commands
  processed = processed.replace(/\\par\s*/g, '<br><br>'); // \par creates a new paragraph
  processed = processed.replace(/\\qquad/g, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'); // \qquad is 2em space
  processed = processed.replace(/\\quad/g, '&nbsp;&nbsp;&nbsp;&nbsp;'); // \quad is 1em space
  
  // Process line breaks (convert \\\\ to <br>) - AFTER math processing
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
  const lines = processed.split('\n');
  let inList = false;
  let listType = '';
  const result = [];
  
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
    
    let style = 'max-width: 100%; height: auto; border-radius: 8px;';
    if (size) {
      // Handle percentage sizes like |30%|
      const percentage = size.replace('%', '');
      if (!isNaN(Number(percentage))) {
        style = `width: ${percentage}%; height: auto; border-radius: 8px;`;
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
    } catch {
      return '∞';
    }
  });

  return processed;
}

export function MathContent({ content, documentId }: { content: string; documentId?: string }) {
  // Parse content for graph blocks and regular content
  const { segments, hasGraphs } = useMemo(() => {
    const graphRegex = /```graph\s*\n([\s\S]*?)```/g;
    const segments: Array<{ type: 'html' | 'graph'; content: string | GraphData }> = [];
    let lastIndex = 0;
    let match;
    let hasGraphs = false;

    while ((match = graphRegex.exec(content)) !== null) {
      // Add HTML content before the graph
      if (match.index > lastIndex) {
        const htmlContent = content.substring(lastIndex, match.index);
        if (htmlContent.trim()) {
          segments.push({
            type: 'html',
            content: renderMath(htmlContent, documentId)
          });
        }
      }

      // Try to parse the graph JSON
      try {
        const graphData = JSON.parse(match[1]);
        console.log('Parsed graph data:', graphData); // Debug log
        segments.push({
          type: 'graph',
          content: graphData
        });
        hasGraphs = true;
      } catch (e) {
        // If JSON parsing fails, treat it as regular content
        console.error('Failed to parse graph JSON:', e, 'Raw content:', match[1]);
        segments.push({
          type: 'html',
          content: renderMath(match[0], documentId)
        });
      }

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining content
    if (lastIndex < content.length) {
      const remainingContent = content.substring(lastIndex);
      if (remainingContent.trim()) {
        segments.push({
          type: 'html',
          content: renderMath(remainingContent, documentId)
        });
      }
    }

    // If no graphs were found, just return the whole content as HTML
    if (segments.length === 0) {
      segments.push({
        type: 'html',
        content: renderMath(content, documentId)
      });
    }

    return { segments, hasGraphs };
  }, [content, documentId]);

  // If no graphs, render as before
  if (!hasGraphs) {
    return (
      <div 
        className="math-content"
        dangerouslySetInnerHTML={{ __html: segments[0]?.content as string }}
      />
    );
  }

  // Render mixed content with graphs
  return (
    <div className="math-content space-y-4">
      {segments.map((segment, index) => {
        if (segment.type === 'html') {
          return (
            <div 
              key={index}
              dangerouslySetInnerHTML={{ __html: segment.content as string }}
            />
          );
        } else {
          return (
            <div key={index} className="my-4">
              <GraphRenderer graphData={segment.content as GraphData} />
            </div>
          );
        }
      })}
    </div>
  );
}
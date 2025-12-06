import React, { useEffect, useRef } from 'react';

// Declare katex global since we are loading it via CDN in index.html
declare const katex: any;

interface MathRendererProps {
  text: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '' }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current && typeof katex !== 'undefined') {
      // Logic to render mixed content (Text + Math)
      // We manually split by delimiters $$...$$ (block) or \(...\) (inline)
      // Note: A simpler approach using renderMathInElement extension could be used, 
      // but manual parsing is safer for React to avoid DOM conflicts.
      
      const render = () => {
         try {
             // Basic regex split. 
             // Look for $$...$$ or \(...\)
             // This is a simplified parser. For robust parsing, we trust user inputs valid LaTeX.
             
             // If user uses $$ x^2 $$, we render display mode.
             // If user uses \( x^2 \), we render inline mode.
             
             const parts = text.split(/(\$\$[\s\S]*?\$\$|\\\(.*?\\\))/g);
             
             containerRef.current!.innerHTML = '';
             
             parts.forEach(part => {
                 if (part.startsWith('$$') && part.endsWith('$$')) {
                     const math = part.slice(2, -2);
                     const span = document.createElement('div'); // Block element
                     try {
                        katex.render(math, span, { displayMode: true, throwOnError: false });
                     } catch(e) { span.innerText = part; }
                     containerRef.current!.appendChild(span);
                 } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
                     const math = part.slice(2, -2);
                     const span = document.createElement('span');
                     try {
                        katex.render(math, span, { displayMode: false, throwOnError: false });
                     } catch(e) { span.innerText = part; }
                     containerRef.current!.appendChild(span);
                 } else {
                     // Regular text
                     const span = document.createElement('span');
                     span.innerText = part;
                     containerRef.current!.appendChild(span);
                 }
             });
         } catch (e) {
             console.error("Math render error", e);
             containerRef.current!.innerText = text;
         }
      };

      render();
    } else if (containerRef.current) {
        containerRef.current.innerText = text;
    }
  }, [text]);

  return <span ref={containerRef} className={className} />;
};
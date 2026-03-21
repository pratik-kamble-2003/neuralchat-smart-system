import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import useThemeStore from '../store/themeStore';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle}
      className="text-xs px-2 py-0.5 rounded transition-colors"
      style={{
        background: copied ? 'rgba(34,197,94,0.15)' : 'var(--color-surface)',
        color: copied ? '#22c55e' : 'var(--color-text-muted)',
        border: '1px solid var(--color-border)',
      }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const { theme } = useThemeStore();
  const match = /language-(\w+)/.exec(className || '');
  const lang = match?.[1] || '';
  const code = String(children).replace(/\n$/, '');

  if (inline) {
    return <code className={className} {...props}>{children}</code>;
  }

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span>{lang || 'code'}</span>
        <CopyButton text={code} />
      </div>
      <SyntaxHighlighter
        style={theme === 'dark' ? oneDark : oneLight}
        language={lang || 'text'}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.8125rem', lineHeight: 1.6 }}
        {...props}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default function MarkdownMessage({ content }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
          // Open links in new tab
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
          ),
        }}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

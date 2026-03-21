import React, { useEffect, useRef, useCallback } from 'react';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import MarkdownMessage from './MarkdownMessage';
import { formatDistanceToNow } from 'date-fns';

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

function MessageBubble({ message, isUser }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group flex gap-3 px-4 py-3 animate-slide-up ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold mt-0.5`}
        style={isUser
          ? { background: 'var(--color-user-bubble)', color: 'var(--color-user-text)' }
          : { background: 'var(--color-accent)', color: '#fff' }}>
        {isUser ? '👤' : '✦'}
      </div>

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] lg:max-w-[75%]`}>
        {/* Bubble */}
        <div className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed`}
          style={isUser
            ? {
              background: 'var(--color-user-bubble)',
              color: 'var(--color-user-text)',
              borderBottomRightRadius: '6px',
            }
            : {
              background: 'var(--color-ai-bubble)',
              color: 'var(--color-ai-text)',
              borderBottomLeftRadius: '6px',
              border: '1px solid var(--color-border)',
            }}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownMessage content={message.content} />
          )}
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {message.createdAt
              ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })
              : ''}
          </span>
          {!isUser && (
            <button onClick={handleCopy}
              className="text-xs transition-colors"
              style={{ color: copied ? '#22c55e' : 'var(--color-text-muted)' }}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StreamingBubble({ content }) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold mt-0.5"
        style={{ background: 'var(--color-accent)', color: '#fff' }}>✦</div>
      <div className="flex flex-col items-start max-w-[85%] lg:max-w-[75%]">
        <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
          style={{
            background: 'var(--color-ai-bubble)',
            color: 'var(--color-ai-text)',
            borderBottomLeftRadius: '6px',
            border: '1px solid var(--color-border)',
            minWidth: '60px',
          }}>
          {content ? <MarkdownMessage content={content} /> : <TypingDots />}
          {/* Cursor blink */}
          {content && (
            <span className="inline-block w-0.5 h-4 ml-0.5 align-middle"
              style={{ background: 'var(--color-accent)', animation: 'pulseDot 1s step-end infinite' }} />
          )}
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onPrompt }) {
  const { user } = useAuthStore();
  const suggestions = [
    { icon: '✍️', text: 'Write a Python function to sort a list' },
    { icon: '🌍', text: 'Explain quantum computing simply' },
    { icon: '📝', text: 'Draft a professional email' },
    { icon: '🔍', text: 'How does React reconciliation work?' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-2xl"
        style={{ background: 'var(--color-accent-muted)' }}>✦</div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
        Hello, {user?.name?.split(' ')[0] || 'there'}!
      </h2>
      <p className="text-sm mb-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
        Start a conversation or pick a suggestion
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {suggestions.map(({ icon, text }) => (
          <button key={text} onClick={() => onPrompt(text)}
            className="flex items-start gap-3 p-3.5 rounded-xl text-left text-sm transition-all border"
            style={{
              background: 'var(--color-surface-raised)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent)';
              e.currentTarget.style.background = 'var(--color-accent-muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.background = 'var(--color-surface-raised)';
            }}>
            <span className="text-base">{icon}</span>
            <span>{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatWindow({ chat, isLoading, isStreaming }) {
  const { streamingContent, stopStreaming } = useChatStore();
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const [autoScroll, setAutoScroll] = React.useState(true);

  // Auto-scroll on new messages / streaming
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat?.messages?.length, streamingContent, autoScroll]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 80;
    setAutoScroll(atBottom);
  }, []);

  const handleSuggestion = useCallback((text) => {
    // Bubble up through ChatPage via event
    window.dispatchEvent(new CustomEvent('chat:suggest', { detail: text }));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-[var(--color-accent)] animate-spin" />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading messages…</p>
        </div>
      </div>
    );
  }

  const messages = chat?.messages || [];
  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <div ref={containerRef} onScroll={handleScroll}
      className="h-full overflow-y-auto">
      {isEmpty ? (
        <WelcomeScreen onPrompt={handleSuggestion} />
      ) : (
        <div className="max-w-3xl mx-auto pb-6 pt-4">
          {messages.map((msg) => (
            <MessageBubble key={msg._id} message={msg} isUser={msg.role === 'user'} />
          ))}

          {isStreaming && <StreamingBubble content={streamingContent} />}

          {/* Stop button */}
          {isStreaming && (
            <div className="flex justify-center mt-2">
              <button onClick={stopStreaming}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-colors"
                style={{
                  background: 'var(--color-surface-raised)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
                Stop generating
              </button>
            </div>
          )}

          {/* Scroll anchor */}
          {!autoScroll && (
            <div className="flex justify-center sticky bottom-4 mt-4">
              <button onClick={() => { setAutoScroll(true); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                className="px-3 py-1.5 rounded-full text-xs border shadow-md transition-colors"
                style={{
                  background: 'var(--color-surface-raised)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}>
                ↓ Scroll to bottom
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

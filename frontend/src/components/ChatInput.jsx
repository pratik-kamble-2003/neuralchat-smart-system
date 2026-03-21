import React, { useState, useRef, useEffect, useCallback } from 'react';
import useChatStore from '../store/chatStore';

export default function ChatInput({ onSend, isStreaming, disabled }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  // Listen for suggestion events from WelcomeScreen
  useEffect(() => {
    const handler = (e) => {
      setValue(e.detail);
      textareaRef.current?.focus();
    };
    window.addEventListener('chat:suggest', handler);
    return () => window.removeEventListener('chat:suggest', handler);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 240) + 'px';
  }, [value]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isStreaming, disabled, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim().length > 0 && !isStreaming && !disabled;

  return (
    <div className="px-4 py-4 max-w-3xl mx-auto w-full">
      <div className="relative flex items-end gap-2 rounded-2xl border px-4 py-3 transition-all"
        style={{
          background: 'var(--color-surface-raised)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
        onFocusCapture={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
        onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'Generating response…' : 'Message NeuralChat…'}
          disabled={disabled}
          rows={1}
          className="chat-input flex-1 bg-transparent outline-none text-sm resize-none placeholder:text-[var(--color-text-muted)] disabled:cursor-not-allowed"
          style={{ color: 'var(--color-text-primary)', lineHeight: '1.6' }}
        />

        {/* Character counter (shows when close to limit) */}
        {value.length > 6000 && (
          <span className="absolute top-2 right-16 text-xs"
            style={{ color: value.length > 7500 ? '#ef4444' : 'var(--color-text-muted)' }}>
            {value.length}/8000
          </span>
        )}

        {/* Send / Stop button */}
        <button
          onClick={isStreaming ? () => useChatStore.getState().stopStreaming() : handleSend}
          disabled={!isStreaming && !canSend}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: isStreaming ? '#ef4444' : canSend ? 'var(--color-accent)' : 'var(--color-surface-overlay)',
            color: isStreaming || canSend ? '#fff' : 'var(--color-text-muted)',
          }}>
          {isStreaming ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <p className="text-center text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
        Press <kbd className="px-1 py-0.5 rounded text-xs border"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-overlay)' }}>Enter</kbd> to send,{' '}
        <kbd className="px-1 py-0.5 rounded text-xs border"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-overlay)' }}>Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}

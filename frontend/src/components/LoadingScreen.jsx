import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'var(--color-surface)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--color-accent)] animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-[var(--color-text-muted)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
      </div>
    </div>
  );
}

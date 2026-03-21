import React, { useState, useRef, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

function ChatItem({ chat, isActive, onSelect, onRename, onDelete, onPin }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  const handleRenameSubmit = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== chat.title) onRename(chat._id, trimmed);
    setIsEditing(false);
  };

  return (
    <div
      className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors mx-2 mb-0.5`}
      style={{
        background: isActive ? 'var(--color-sidebar-active)' : 'transparent',
      }}
      onClick={() => !isEditing && onSelect(chat._id)}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--color-sidebar-hover)'; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>

      {/* Pin indicator */}
      {chat.isPinned && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--color-accent)" className="shrink-0 opacity-70">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
        </svg>
      )}

      {isEditing ? (
        <input
          ref={inputRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRenameSubmit();
            if (e.key === 'Escape') { setEditTitle(chat.title); setIsEditing(false); }
          }}
          autoFocus
          className="flex-1 text-sm bg-transparent outline-none border-b"
          style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-accent)' }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
          {chat.title}
        </span>
      )}

      {/* Context menu trigger */}
      {!isEditing && (
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-md shrink-0"
          style={{ color: 'var(--color-text-muted)' }}
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      )}

      {/* Dropdown menu */}
      {menuOpen && (
        <div
          className="absolute right-2 top-8 z-50 rounded-xl overflow-hidden shadow-lg border py-1 min-w-[140px] animate-fade-in"
          style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}
          onClick={(e) => e.stopPropagation()}>
          {[
            { label: chat.isPinned ? 'Unpin' : 'Pin', icon: '📌', action: () => { onPin(chat._id); setMenuOpen(false); } },
            { label: 'Rename', icon: '✏️', action: () => { setIsEditing(true); setMenuOpen(false); setTimeout(() => inputRef.current?.focus(), 50); } },
            { label: 'Delete', icon: '🗑️', action: () => { onDelete(chat._id); setMenuOpen(false); }, danger: true },
          ].map(({ label, icon, action, danger }) => (
            <button key={label} onClick={action}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors text-left"
              style={{ color: danger ? '#ef4444' : 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-overlay)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ chats, activeChatId, user, onNewChat, onSelectChat, onCloseMobile }) {
  const { deleteChat, deleteAllChats, renameChat, togglePin, loadMoreChats, pagination, isLoadingChats } = useChatStore();
  const { logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleDelete = useCallback(async (chatId) => {
    try { await deleteChat(chatId); toast.success('Chat deleted'); }
    catch { toast.error('Failed to delete chat'); }
  }, []);

  const handleRename = useCallback(async (chatId, title) => {
    try { await renameChat(chatId, title); }
    catch { toast.error('Failed to rename'); }
  }, []);

  const handlePin = useCallback(async (chatId) => {
    try { await togglePin(chatId); }
    catch { toast.error('Failed to update pin'); }
  }, []);

  const handleDeleteAll = async () => {
    try { await deleteAllChats(); setShowDeleteAll(false); toast.success('All chats deleted'); }
    catch { toast.error('Failed to delete chats'); }
  };

  const pinnedChats = chats.filter((c) => c.isPinned);
  const unpinnedChats = chats.filter((c) => !c.isPinned);

  return (
    <div className="flex flex-col h-full w-full"
      style={{ background: 'var(--color-sidebar)', borderRight: '1px solid var(--color-border)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>NeuralChat</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <button onClick={toggle}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-sm"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-sidebar-active)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {/* Close on mobile */}
          <button onClick={onCloseMobile}
            className="w-7 h-7 rounded-lg flex items-center justify-center md:hidden"
            style={{ color: 'var(--color-text-muted)' }}>
            ✕
          </button>
        </div>
      </div>

      {/* New Chat button */}
      <div className="px-3 pb-3 shrink-0">
        <button onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-accent)')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New chat
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto py-1">
        {isLoadingChats && chats.length === 0 ? (
          <div className="space-y-1 px-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-9 rounded-xl shimmer" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No chats yet.<br />Start a new conversation!</p>
          </div>
        ) : (
          <>
            {pinnedChats.length > 0 && (
              <div className="mb-2">
                <p className="px-5 py-1 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}>Pinned</p>
                {pinnedChats.map((chat) => (
                  <ChatItem key={chat._id} chat={chat} isActive={chat._id === activeChatId}
                    onSelect={onSelectChat} onRename={handleRename} onDelete={handleDelete} onPin={handlePin} />
                ))}
              </div>
            )}

            {unpinnedChats.length > 0 && (
              <div>
                {pinnedChats.length > 0 && (
                  <p className="px-5 py-1 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)' }}>Recent</p>
                )}
                {unpinnedChats.map((chat) => (
                  <ChatItem key={chat._id} chat={chat} isActive={chat._id === activeChatId}
                    onSelect={onSelectChat} onRename={handleRename} onDelete={handleDelete} onPin={handlePin} />
                ))}
              </div>
            )}

            {pagination?.hasMore && (
              <button onClick={loadMoreChats}
                className="w-full text-xs py-2 mt-1 transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
                Load more
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t p-3 space-y-1"
        style={{ borderColor: 'var(--color-border)' }}>

        {/* Delete all */}
        {chats.length > 0 && (
          showDeleteAll ? (
            <div className="flex gap-2 px-1 py-1 animate-fade-in">
              <p className="text-xs flex-1" style={{ color: 'var(--color-text-muted)' }}>Delete all chats?</p>
              <button onClick={handleDeleteAll} className="text-xs text-red-500 font-medium hover:text-red-400">Yes</button>
              <button onClick={() => setShowDeleteAll(false)} className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No</button>
            </div>
          ) : (
            <button onClick={() => setShowDeleteAll(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-sidebar-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
              </svg>
              Clear all chats
            </button>
          )
        )}

        {/* User profile */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors"
          style={{ color: 'var(--color-text-primary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-sidebar-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          onClick={() => setShowProfile(!showProfile)}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{user?.email}</p>
          </div>
          {showProfile && (
            <button onClick={async (e) => { e.stopPropagation(); await useAuthStore.getState().logout(); }}
              className="text-xs px-2 py-1 rounded-lg transition-colors"
              style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

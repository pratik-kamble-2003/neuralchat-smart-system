import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';

export default function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    chats, activeChatId, activeChat, isLoadingMessages, isStreaming,
    fetchChats, setActiveChat, createNewChat, sendMessage, clearActiveChat,
  } = useChatStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Initial load
  useEffect(() => {
    fetchChats();
  }, []);

  // Sync URL param to active chat
  useEffect(() => {
    if (chatId) {
      setActiveChat(chatId);
    } else {
      clearActiveChat();
    }
  }, [chatId]);

  const handleNewChat = useCallback(async () => {
    try {
      const chat = await createNewChat();
      navigate(`/chat/${chat._id}`);
      setMobileSidebarOpen(false);
    } catch {
      toast.error('Failed to create chat');
    }
  }, [navigate]);

  const handleSelectChat = useCallback((id) => {
    navigate(`/chat/${id}`);
    setMobileSidebarOpen(false);
  }, [navigate]);

  const handleSend = useCallback(async (message) => {
    if (!activeChatId) {
      // Create a chat first, then send
      try {
        const chat = await createNewChat();
        navigate(`/chat/${chat._id}`, { replace: true });
        // Wait for state to settle then send
        setTimeout(() => {
          useChatStore.getState().sendMessage(message, toast);
        }, 100);
      } catch {
        toast.error('Failed to start chat');
      }
      return;
    }
    sendMessage(message, toast);
  }, [activeChatId, navigate]);

  return (
    <div className="flex h-screen w-screen overflow-hidden transition-theme"
      style={{ background: 'var(--color-surface)' }}>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="sidebar-overlay md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-50 md:z-auto h-full
        transition-transform duration-300 ease-in-out
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${sidebarOpen ? 'md:w-64 lg:w-72' : 'md:w-0'}
      `}>
        {sidebarOpen && (
          <Sidebar
            chats={chats}
            activeChatId={activeChatId}
            user={user}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        )}
      </aside>

      {/* Main area */}
      <main className="flex flex-col flex-1 min-w-0 h-full">
        {/* Top bar */}
        <header className="flex items-center px-4 py-3 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          {/* Mobile menu / Desktop toggle */}
          <button
            onClick={() => {
              if (window.innerWidth < 768) setMobileSidebarOpen(true);
              else setSidebarOpen((v) => !v);
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-overlay)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <h2 className="text-sm font-medium truncate flex-1" style={{ color: 'var(--color-text-primary)' }}>
            {activeChat?.title || 'NeuralChat'}
          </h2>

          {/* Model badge */}
          <span className="text-xs px-2 py-0.5 rounded-full ml-2 hidden sm:block"
            style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
            GPT-4o mini
          </span>
        </header>

        {/* Chat messages */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatWindow
            chat={activeChat}
            isLoading={isLoadingMessages}
            isStreaming={isStreaming}
          />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <ChatInput onSend={handleSend} isStreaming={isStreaming} disabled={isLoadingMessages} />
        </div>
      </main>
    </div>
  );
}

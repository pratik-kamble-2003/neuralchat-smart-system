import { create } from 'zustand';
import { chatService } from '../services/chatService';

const useChatStore = create((set, get) => ({
  chats: [],
  activeChatId: null,
  activeChat: null,
  isLoadingChats: false,
  isLoadingMessages: false,
  isStreaming: false,
  streamingContent: '',
  pagination: { page: 1, hasMore: false },
  abortController: null,

  // ── Sidebar chat list ─────────────────────────────────────────────────
  fetchChats: async (page = 1) => {
    set({ isLoadingChats: true });
    try {
      const { data } = await chatService.getChats({ page, limit: 30 });
      set((s) => ({
        chats: page === 1 ? data.chats : [...s.chats, ...data.chats],
        pagination: data.pagination,
        isLoadingChats: false,
      }));
    } catch {
      set({ isLoadingChats: false });
    }
  },

  loadMoreChats: () => {
    const { pagination } = get();
    if (pagination.hasMore) get().fetchChats(pagination.page + 1);
  },

  // ── Active chat ───────────────────────────────────────────────────────
  setActiveChat: async (chatId) => {
    if (!chatId) {
      set({ activeChatId: null, activeChat: null });
      return;
    }
    set({ activeChatId: chatId, isLoadingMessages: true });
    try {
      const { data } = await chatService.getChat(chatId);
      set({ activeChat: data.chat, isLoadingMessages: false });
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  createNewChat: async () => {
    const { data } = await chatService.createChat();
    set((s) => ({ chats: [data.chat, ...s.chats] }));
    return data.chat;
  },

  // ── Messaging ─────────────────────────────────────────────────────────
  sendMessage: async (message, toast) => {
    const { activeChatId, activeChat } = get();
    if (!activeChatId || !message.trim()) return;

    // Optimistically add user message
    const userMsg = { _id: Date.now().toString(), role: 'user', content: message, createdAt: new Date() };
    set((s) => ({
      activeChat: { ...s.activeChat, messages: [...(s.activeChat?.messages || []), userMsg] },
      isStreaming: true,
      streamingContent: '',
    }));

    const abortController = new AbortController();
    set({ abortController });

    let fullContent = '';

    try {
      await chatService.sendMessageStream(
        activeChatId,
        message,
        (delta) => {
          fullContent += delta;
          set({ streamingContent: fullContent });
        },
        (doneEvent) => {
          // Add final assistant message and update chat title
          const aiMsg = {
            _id: Date.now().toString() + '-ai',
            role: 'assistant',
            content: fullContent,
            createdAt: new Date(),
          };
          set((s) => ({
            activeChat: {
              ...s.activeChat,
              title: doneEvent.title || s.activeChat?.title,
              messages: [...(s.activeChat?.messages || []), aiMsg],
            },
            isStreaming: false,
            streamingContent: '',
            abortController: null,
            // Update sidebar title
            chats: s.chats.map((c) =>
              c._id === activeChatId
                ? { ...c, title: doneEvent.title || c.title, lastMessageAt: new Date() }
                : c
            ),
          }));
        },
        (errMsg) => {
          toast?.error(errMsg || 'AI response failed');
          set((s) => ({
            // Remove the optimistic user message on error
            activeChat: {
              ...s.activeChat,
              messages: s.activeChat?.messages?.filter((m) => m._id !== userMsg._id) || [],
            },
            isStreaming: false,
            streamingContent: '',
            abortController: null,
          }));
        },
        abortController.signal
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast?.error('Connection error');
      }
      set((s) => ({
        activeChat: {
          ...s.activeChat,
          messages: s.activeChat?.messages?.filter((m) => m._id !== userMsg._id) || [],
        },
        isStreaming: false,
        streamingContent: '',
        abortController: null,
      }));
    }
  },

  stopStreaming: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ isStreaming: false, streamingContent: '', abortController: null });
    }
  },

  // ── Chat management ───────────────────────────────────────────────────
  deleteChat: async (chatId) => {
    await chatService.deleteChat(chatId);
    set((s) => ({
      chats: s.chats.filter((c) => c._id !== chatId),
      activeChatId: s.activeChatId === chatId ? null : s.activeChatId,
      activeChat: s.activeChatId === chatId ? null : s.activeChat,
    }));
  },

  deleteAllChats: async () => {
    await chatService.deleteAllChats();
    set({ chats: [], activeChatId: null, activeChat: null });
  },

  renameChat: async (chatId, title) => {
    const { data } = await chatService.renameChat(chatId, title);
    set((s) => ({
      chats: s.chats.map((c) => (c._id === chatId ? { ...c, title: data.chat.title } : c)),
      activeChat: s.activeChatId === chatId ? { ...s.activeChat, title: data.chat.title } : s.activeChat,
    }));
  },

  togglePin: async (chatId) => {
    const { data } = await chatService.togglePin(chatId);
    set((s) => ({
      chats: s.chats
        .map((c) => (c._id === chatId ? { ...c, isPinned: data.isPinned } : c))
        .sort((a, b) => (b.isPinned - a.isPinned) || new Date(b.lastMessageAt) - new Date(a.lastMessageAt)),
    }));
  },

  clearActiveChat: () => set({ activeChatId: null, activeChat: null }),
}));

export default useChatStore;

import api from './api';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const chatService = {
  getChats: (params) => api.get('/chats', { params }),
  getChat: (chatId) => api.get(`/chats/${chatId}`),
  createChat: () => api.post('/chats'),
  deleteChat: (chatId) => api.delete(`/chats/${chatId}`),
  deleteAllChats: () => api.delete('/chats'),
  renameChat: (chatId, title) => api.patch(`/chats/${chatId}/title`, { title }),
  togglePin: (chatId) => api.patch(`/chats/${chatId}/pin`),

  sendMessageStream: async (chatId, message, onDelta, onDone, onError, signal) => {
    const token = localStorage.getItem('accessToken');

    let response;
    try {
      response = await fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, stream: true }),
        signal,
      });
    } catch (err) {
      onError(err.message || 'Network error');
      return;
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      onError(err.message || 'Failed to send message');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const event = JSON.parse(raw);
            if (event.type === 'delta') onDelta(event.content);
            else if (event.type === 'done') onDone(event);
            else if (event.type === 'error') onError(event.message);
          } catch { /* ignore malformed */ }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') onError(err.message);
    }
  },
};

import { create } from 'zustand';
import { authService } from '../services/authService';

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setAccessToken: (token) => {
    if (token) localStorage.setItem('accessToken', token);
    else localStorage.removeItem('accessToken');
    set({ accessToken: token });
  },

  login: async (credentials) => {
    const { data } = await authService.login(credentials);
    get().setAccessToken(data.accessToken);
    set({ user: data.user, isAuthenticated: true });
    return data;
  },

  register: async (credentials) => {
    const { data } = await authService.register(credentials);
    get().setAccessToken(data.accessToken);
    set({ user: data.user, isAuthenticated: true });
    return data;
  },

  logout: async () => {
    try { await authService.logout(); } catch { /* silent */ }
    get().setAccessToken(null);
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data } = await authService.getMe();
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      // Try to refresh
      try {
        const { data } = await authService.refresh();
        get().setAccessToken(data.accessToken);
        set({ user: data.user, isAuthenticated: true, isLoading: false });
      } catch {
        get().setAccessToken(null);
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
  },

  updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),
}));

export default useAuthStore;

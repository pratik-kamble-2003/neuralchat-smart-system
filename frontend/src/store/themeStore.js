import { create } from 'zustand';

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const useThemeStore = create((set) => {
  const stored = localStorage.getItem('theme');
  const initial = stored || getSystemTheme();
  if (initial === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');

  return {
    theme: initial,
    toggle: () =>
      set((s) => {
        const next = s.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', next);
        if (next === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        return { theme: next };
      }),
  };
});

export default useThemeStore;

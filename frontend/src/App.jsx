import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import LoadingScreen from './components/LoadingScreen';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <LoadingScreen />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <LoadingScreen />;
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

export default function App() {
  const { loadUser } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    loadUser();

    // Handle forced logout from API interceptor
    const handleLogout = () => {
      useAuthStore.getState().setAccessToken(null);
      useAuthStore.setState({ user: null, isAuthenticated: false });
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  return (
    <>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/chat/:chatId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--color-surface-raised)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontFamily: 'Sora, sans-serif',
            boxShadow: 'var(--shadow-md)',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: 'var(--color-surface)' } },
          error: { iconTheme: { primary: '#ef4444', secondary: 'var(--color-surface)' } },
        }}
      />
    </>
  );
}

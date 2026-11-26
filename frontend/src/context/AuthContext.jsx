import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true while checking stored session

  // ─── Hydrate from localStorage on mount ─────────────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('guardtrack_token');
    const storedUser = localStorage.getItem('guardtrack_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem('guardtrack_token');
        localStorage.removeItem('guardtrack_user');
      }
    }
    setIsLoading(false);
  }, []);

  // ─── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token: newToken, user: newUser } = response.data;

    localStorage.setItem('guardtrack_token', newToken);
    localStorage.setItem('guardtrack_user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    return newUser; // Caller uses role to redirect
  }, []);

  // ─── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('guardtrack_token');
    localStorage.removeItem('guardtrack_user');
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

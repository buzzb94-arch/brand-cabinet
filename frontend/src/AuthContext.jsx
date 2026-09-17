import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuth(!!localStorage.getItem('token'));
    setLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    setAuth(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuth(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
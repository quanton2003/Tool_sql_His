import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import axios from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const interceptorRef = useRef<number | null>(null);

  // Setup axios interceptor to add token to requests
  useEffect(() => {
    // Remove existing interceptor if any
    if (interceptorRef.current !== null) {
      axios.interceptors.request.eject(interceptorRef.current);
    }

    // Add request interceptor
    interceptorRef.current = axios.interceptors.request.use(
      (config) => {
        const savedToken = localStorage.getItem('auth_token');
        if (savedToken) {
          config.headers.Authorization = `Bearer ${savedToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      if (interceptorRef.current !== null) {
        axios.interceptors.request.eject(interceptorRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUsername = localStorage.getItem('auth_username');
    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUsername(savedUsername);
      setIsAuthenticated(true);
    }
    setIsInitialized(true);
  }, []);

  const login = async (user: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/login', {
        username: user,
        password: pass,
      });
      const { access_token, username: name } = response.data;
      setToken(access_token);
      setUsername(name);
      setIsAuthenticated(true);
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('auth_username', name);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    setIsAuthenticated(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, token, login, logout, loading, error, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthLoader({ children }: { children: ReactNode }) {
  const { isInitialized } = useAuth();
  
  if (!isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#0c151b',
        color: '#e7f0ed',
        fontFamily: 'sans-serif'
      }}>
        Đang tải...
      </div>
    );
  }
  
  return <>{children}</>;
}

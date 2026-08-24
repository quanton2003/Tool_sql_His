import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Card, Button, Tag, Typography, Space, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AuthProvider, AuthLoader, useAuth } from './contexts/AuthContext';
import AppLayout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ChucNang from './pages/ChucNang';
import SqlQuery from './pages/SqlQuery';
import TraCuuDatabase from './pages/TraCuuDatabase';
import Knowledge from './pages/Knowledge';
import SqlHistory from './pages/SqlHistory';
import Settings from './pages/Settings';
import SqlAssistant from './pages/SqlAssistant';
import Login from './pages/Login';
import axios from 'axios';

const { Title, Text } = Typography;

function HealthCheck() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const { isAuthenticated } = useAuth();

  const checkBackend = async () => {
    setBackendStatus('checking');
    try {
      await axios.get('/api/health');
      setBackendStatus('online');
    } catch {
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div style={styles.container}>
      <Card style={styles.card} bordered={false}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={3} style={{ textAlign: 'center', margin: 0, color: '#e7f0ed' }}>
            HIS SQL Assistant
          </Title>

          <div style={styles.statusRow}>
            <Text strong style={{ color: '#e7f0ed' }}>Frontend:</Text>
            <Tag color="green">Online</Tag>
          </div>

          <div style={styles.statusRow}>
            <Text strong style={{ color: '#e7f0ed' }}>Backend:</Text>
            {backendStatus === 'checking' ? (
              <Tag color="orange">Checking...</Tag>
            ) : backendStatus === 'online' ? (
              <Tag color="green">Online</Tag>
            ) : (
              <Tag color="red">Offline</Tag>
            )}
          </div>

          <Button type="primary" block onClick={checkBackend} loading={backendStatus === 'checking'} style={styles.checkButton}>
            Kiểm tra kết nối Backend
          </Button>
          <Button type="default" block onClick={() => window.location.href = '/login'} style={styles.loginButton}>
            Đăng nhập
          </Button>
        </Space>
      </Card>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0c151b 0%, #1a2b33 50%, #0c151b 100%)',
    padding: '2rem',
  },
  card: {
    maxWidth: 400,
    width: '100%',
    background: 'rgba(20, 35, 42, 0.95)',
    borderRadius: 16,
    border: '1px solid rgba(54, 181, 168, 0.2)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
    padding: '32px',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkButton: {
    height: 42,
    borderRadius: 8,
    background: 'linear-gradient(135deg, #36b5a8 0%, #2a9d90 100%)',
    border: 'none',
    fontWeight: 600,
  },
  loginButton: {
    height: 42,
    borderRadius: 8,
    borderColor: 'rgba(54, 181, 168, 0.4)',
    color: '#36b5a8',
    background: 'rgba(54, 181, 168, 0.1)',
    fontWeight: 600,
  },
};

function App() {
  return (
    <ConfigProvider locale={viVN} theme={{ algorithm: theme.darkAlgorithm, token: { colorPrimary: '#36b5a8', colorLink: '#65d1c4', colorBgBase: '#0c151b', colorBgContainer: '#14232a', colorBgElevated: '#1a2b33', colorBorder: '#2d444b', colorText: '#e7f0ed', colorTextSecondary: '#9db2b0', borderRadius: 7, fontFamily: "'Aptos', 'Trebuchet MS', sans-serif" } }}>
      <AuthProvider>
        <BrowserRouter>
          <AuthLoader>
            <Routes>
              <Route path="/" element={<HealthCheck />} />
              <Route path="/login" element={<Login />} />
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="chuc-nang" element={<ChucNang />} />
                <Route path="sql-query" element={<SqlQuery />} />
                <Route path="sql-assistant" element={<SqlAssistant />} />
                <Route path="tra-cuu-database" element={<TraCuuDatabase />} />
                <Route path="knowledge" element={<Knowledge />} />
                <Route path="history" element={<SqlHistory />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthLoader>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;

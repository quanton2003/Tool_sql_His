import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Card, Button, Tag, Typography, Space } from 'antd';
import viVN from 'antd/locale/vi_VN';
import AppLayout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ChucNang from './pages/ChucNang';
import SqlQuery from './pages/SqlQuery';
import TraCuuDatabase from './pages/TraCuuDatabase';
import Knowledge from './pages/Knowledge';
import SqlHistory from './pages/SqlHistory';
import Settings from './pages/Settings';
import axios from 'axios';

const { Title, Text } = Typography;

function HealthCheck() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const checkBackend = async () => {
    setBackendStatus('checking');
    try {
      await axios.get('http://localhost:3000/api/health');
      setBackendStatus('online');
    } catch {
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  return (
    <div style={styles.container}>
      <Card style={styles.card} bordered>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={3} style={{ textAlign: 'center', margin: 0 }}>
            HIS SQL Assistant
          </Title>

          <div style={styles.statusRow}>
            <Text strong>Frontend:</Text>
            <Tag color="green">Online</Tag>
          </div>

          <div style={styles.statusRow}>
            <Text strong>Backend:</Text>
            {backendStatus === 'checking' ? (
              <Tag color="orange">Checking...</Tag>
            ) : backendStatus === 'online' ? (
              <Tag color="green">Online</Tag>
            ) : (
              <Tag color="red">Offline</Tag>
            )}
          </div>

          <Button type="primary" block onClick={checkBackend} loading={backendStatus === 'checking'}>
            Kiểm tra kết nối Backend
          </Button>
          <Button type="default" block onClick={() => window.location.href = '/app'}>
            Vào ứng dụng
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
    backgroundColor: '#f5f5f5',
    padding: '2rem',
  },
  card: {
    maxWidth: 400,
    width: '100%',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
};

function App() {
  return (
    <ConfigProvider locale={viVN}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HealthCheck />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="chuc-nang" element={<ChucNang />} />
            <Route path="sql-query" element={<SqlQuery />} />
            <Route path="tra-cuu-database" element={<TraCuuDatabase />} />
            <Route path="knowledge" element={<Knowledge />} />
            <Route path="history" element={<SqlHistory />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;

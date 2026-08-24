import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, message } from 'antd';
import { LockOutlined, UserOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function Login() {
  const { login, loading, error, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      await login(values.username, values.password);
      message.success('Đăng nhập thành công!');
      navigate('/app');
    } catch {
      // error is handled by AuthContext
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundPattern} />
      <Card style={styles.card} bordered={false}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>
              <DatabaseOutlined style={{ fontSize: 32, color: '#36b5a8' }} />
            </div>
            <Title level={3} style={styles.title}>
              HIS SQL Assistant
            </Title>
            <Text type="secondary" style={styles.subtitle}>
              Hệ thống hỗ trợ truy vấn Database bệnh viện
            </Text>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <Text style={{ color: '#ff7875' }}>{error}</Text>
            </div>
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Form.Item
              label="Tên đăng nhập"
              name="username"
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#36b5a8' }} />}
                placeholder="Nhập tên đăng nhập"
                size="large"
                style={styles.input}
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#36b5a8' }} />}
                placeholder="Nhập mật khẩu"
                size="large"
                style={styles.input}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                style={styles.loginButton}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </Form.Item>
          </Form>

          <div style={styles.footer}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              © 2026 HIS SQL Assistant - Bệnh viện Đức Giang
            </Text>
          </div>
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
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 20% 80%, rgba(54, 181, 168, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(54, 181, 168, 0.06) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  card: {
    maxWidth: 420,
    width: '100%',
    background: 'rgba(20, 35, 42, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: 16,
    border: '1px solid rgba(54, 181, 168, 0.2)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(54, 181, 168, 0.05)',
    padding: '40px 32px',
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: 8,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: 'rgba(54, 181, 168, 0.1)',
    border: '1px solid rgba(54, 181, 168, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  title: {
    margin: 0,
    color: '#e7f0ed',
    fontWeight: 600,
  },
  subtitle: {
    fontSize: 13,
    color: '#9db2b0',
  },
  errorBox: {
    background: 'rgba(255, 77, 79, 0.1)',
    border: '1px solid rgba(255, 77, 79, 0.3)',
    borderRadius: 8,
    padding: '10px 16px',
    textAlign: 'center',
  },
  input: {
    borderRadius: 8,
    background: 'rgba(12, 21, 27, 0.6)',
    borderColor: 'rgba(54, 181, 168, 0.3)',
  },
  loginButton: {
    height: 46,
    borderRadius: 8,
    background: 'linear-gradient(135deg, #36b5a8 0%, #2a9d90 100%)',
    border: 'none',
    fontWeight: 600,
    fontSize: 15,
    boxShadow: '0 4px 15px rgba(54, 181, 168, 0.3)',
  },
  footer: {
    textAlign: 'center',
    paddingTop: 8,
    borderTop: '1px solid rgba(54, 181, 168, 0.1)',
  },
};

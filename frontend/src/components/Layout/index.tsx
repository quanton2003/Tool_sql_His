import { Layout, Menu, Typography, Tag, Dropdown, Space, Avatar } from 'antd';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AppstoreOutlined, DatabaseOutlined, ExperimentOutlined, FileSearchOutlined, BookOutlined, HistoryOutlined, SettingOutlined, RobotOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/app', label: 'Tổng quan', icon: <AppstoreOutlined /> },
  { key: '/app/chuc-nang', label: 'Chức năng', icon: <ExperimentOutlined /> },
  { key: '/app/sql-query', label: 'SQL Query', icon: <DatabaseOutlined /> },
  { key: '/app/sql-assistant', label: 'Trợ lý SQL', icon: <RobotOutlined /> },
  { key: '/app/tra-cuu-database', label: 'Tra cứu dữ liệu', icon: <FileSearchOutlined /> },
  { key: '/app/knowledge', label: 'Knowledge', icon: <BookOutlined /> },
  { key: '/app/history', label: 'Lịch sử SQL', icon: <HistoryOutlined /> },
  { key: '/app/settings', label: 'Cài đặt', icon: <SettingOutlined /> },
];

const pageNames: Record<string, string> = Object.fromEntries(menuItems.map((item) => [item.key, item.label]));

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout className="app-shell" style={{ minHeight: '100vh' }}>
      <Sider className="app-sider" width={246} breakpoint="lg" collapsedWidth={0}>
        <div className="brand-mark">
          <div className="brand-symbol"><DatabaseOutlined /></div>
          <div className="brand-copy"><strong>HIS Atlas</strong><span>SQL workspace</span></div>
        </div>
        <div className="nav-caption">Workspace</div>
        <Menu
          className="app-menu"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout className="app-main">
        <Header className="app-header">
          <div>
            <Text className="eyebrow">HIS SQL ASSISTANT / LOCAL</Text>
            <h1>{pageNames[location.pathname] || 'Tổng quan'}</h1>
          </div>
          <Space size="middle">
            <Tag className="local-tag" icon={<span className="status-dot" />}>Local only</Tag>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 12px', borderRadius: 8, background: 'rgba(54, 181, 168, 0.1)', border: '1px solid rgba(54, 181, 168, 0.2)' }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ background: '#36b5a8' }} />
                <Text style={{ color: '#e7f0ed', fontSize: 13 }}>{username}</Text>
              </div>
            </Dropdown>
          </Space>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}


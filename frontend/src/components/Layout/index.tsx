import { Layout, Menu, Typography, Tag } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppstoreOutlined, DatabaseOutlined, ExperimentOutlined, FileSearchOutlined, BookOutlined, HistoryOutlined, SettingOutlined, RobotOutlined } from '@ant-design/icons';

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
          <Tag className="local-tag" icon={<span className="status-dot" />}>Local only</Tag>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}


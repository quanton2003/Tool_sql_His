import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/app', label: 'Dashboard', icon: null },
  { key: '/app/chuc-nang', label: 'Chức năng', icon: null },
  { key: '/app/tra-cuu-database', label: 'Tra cứu Database', icon: null },
  { key: '/app/knowledge', label: 'Knowledge', icon: null },
  { key: '/app/history', label: 'SQL History', icon: null },
  { key: '/app/settings', label: 'Settings', icon: null },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div style={{ height: 32, margin: 16, background: 'rgba(255,255,255,0.2)' }} />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px' }}>
          <h3 style={{ margin: 0, lineHeight: '64px' }}>HIS SQL Assistant</h3>
        </Header>
        <Content style={{ margin: '16px', background: '#fff', padding: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

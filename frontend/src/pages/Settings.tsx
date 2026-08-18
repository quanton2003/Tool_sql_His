import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Space, Tag, message, Row, Col } from 'antd';
import { DatabaseOutlined, CloudSyncOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title } = Typography;

export default function Settings() {
  const [companyForm] = Form.useForm();
  const [appForm] = Form.useForm();
  const [companyStatus, setCompanyStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [appStatus, setAppStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      const data = response.data;
      if (data['HIS_DB_HOST']) {
        companyForm.setFieldsValue({
          host: data['HIS_DB_HOST'],
          port: data['HIS_DB_PORT'] || '5432',
          database: data['HIS_DB_NAME'] || 'his_db',
          username: data['HIS_DB_USER'] || '',
          password: data['HIS_DB_PASSWORD'] || '',
          schema: data['HIS_DB_SCHEMA'] || 'public',
        });
      }
      if (data['APP_DB_HOST']) {
        appForm.setFieldsValue({
          host: data['APP_DB_HOST'],
          port: data['APP_DB_PORT'] || '5432',
          database: data['APP_DB_NAME'] || 'app_db',
          username: data['APP_DB_USER'] || '',
          password: data['APP_DB_PASSWORD'] || '',
        });
      }
    } catch {
      // ignore
    }
  };

  const handleCompanyTestConnection = async () => {
    setLoading(true);
    try {
      const response = await api.post('/database/company/test-connection');
      if (response.data.connected) {
        setCompanyStatus('online');
        message.success('Kết nối Company Database thành công');
      } else {
        setCompanyStatus('offline');
        message.error('Kết nối Company Database thất bại');
      }
    } catch {
      setCompanyStatus('offline');
      message.error('Kết nối Company Database thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleAppTestConnection = async () => {
    setLoading(true);
    try {
      const response = await api.post('/database/app/test-connection');
      if (response.data.connected) {
        setAppStatus('online');
        message.success('Kết nối App Database thành công');
      } else {
        setAppStatus('offline');
        message.error('Kết nối App Database thất bại');
      }
    } catch {
      setAppStatus('offline');
      message.error('Kết nối App Database thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSchema = async () => {
    setLoading(true);
    try {
      const values = companyForm.getFieldsValue();
      await api.post('/database/company/sync-schema', {
        databaseName: values.database,
        schemaName: values.schema || 'public',
      });
      message.success('Đồng bộ cấu trúc thành công');
    } catch {
      message.error('Đồng bộ cấu trúc thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async (values: any) => {
    setLoading(true);
    try {
      const settings = [
        { key: 'HIS_DB_HOST', value: values.host },
        { key: 'HIS_DB_PORT', value: values.port },
        { key: 'HIS_DB_NAME', value: values.database },
        { key: 'HIS_DB_USER', value: values.username },
        { key: 'HIS_DB_PASSWORD', value: values.password },
        { key: 'HIS_DB_SCHEMA', value: values.schema },
      ];
      await Promise.all(settings.map((s) => api.put(`/settings/${s.key}`, { value: s.value })));
      message.success('Đã lưu cấu hình Company Database');
    } catch {
      message.error('Lưu cấu hình thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApp = async (values: any) => {
    setLoading(true);
    try {
      const settings = [
        { key: 'APP_DB_HOST', value: values.host },
        { key: 'APP_DB_PORT', value: values.port },
        { key: 'APP_DB_NAME', value: values.database },
        { key: 'APP_DB_USER', value: values.username },
        { key: 'APP_DB_PASSWORD', value: values.password },
      ];
      await Promise.all(settings.map((s) => api.put(`/settings/${s.key}`, { value: s.value })));
      message.success('Đã lưu cấu hình App Database');
    } catch {
      message.error('Lưu cấu hình thất bại');
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status: string) => {
    if (status === 'online') return <Tag color="green" icon={<CheckCircleOutlined />}>Online</Tag>;
    if (status === 'offline') return <Tag color="red" icon={<CloseCircleOutlined />}>Offline</Tag>;
    return <Tag>Chưa cấu hình</Tag>;
  };

  return (
    <div>
      <Title level={4}>Settings</Title>

      <Card
        title={
          <Space>
            <DatabaseOutlined />
            Database công ty (HIS PostgreSQL)
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Space>
              <span>Trạng thái:</span>
              {renderStatus(companyStatus)}
            </Space>
          </div>
          <Form form={companyForm} layout="vertical" onFinish={handleSaveCompany}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Host" name="host" initialValue="localhost">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Port" name="port" initialValue="5432">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Database" name="database" initialValue="his_db">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Schema" name="schema" initialValue="public">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Username" name="username">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Password" name="password">
                  <Input.Password />
                </Form.Item>
              </Col>
            </Row>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Lưu cấu hình
              </Button>
              <Button onClick={handleCompanyTestConnection} loading={loading}>
                Kiểm tra kết nối
              </Button>
              <Button onClick={handleSyncSchema} loading={loading} icon={<CloudSyncOutlined />}>
                Đồng bộ cấu trúc
              </Button>
            </Space>
          </Form>
        </Space>
      </Card>

      <Card
        title={
          <Space>
            <DatabaseOutlined />
            Database ứng dụng (SQLite)
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Space>
              <span>Trạng thái:</span>
              {renderStatus(appStatus)}
            </Space>
          </div>
          <Form form={appForm} layout="vertical" onFinish={handleSaveApp}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Host" name="host" initialValue="localhost">
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Port" name="port" initialValue="5432">
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Database" name="database" initialValue="app_db">
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Username" name="username">
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Password" name="password">
              <Input.Password disabled />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} disabled>
              Lưu cấu hình App Database
            </Button>
            <Button onClick={handleAppTestConnection} loading={loading}>
              Kiểm tra kết nối
            </Button>
          </Form>
        </Space>
      </Card>
    </div>
  );
}

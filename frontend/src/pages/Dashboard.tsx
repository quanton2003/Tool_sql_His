import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Tag, Space } from 'antd';
import { DatabaseOutlined, FileSearchOutlined, HistoryOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;

interface SnapshotInfo {
  id: number;
  databaseName: string;
  schemaName: string;
  tableCount: number;
  columnCount: number;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({ chucNang: 0, knowledge: 0, confirmed: 0 });
  const [snapshot, setSnapshot] = useState<SnapshotInfo | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [chucNangRes, knowledgeRes, snapshotRes] = await Promise.all([
          api.get('/chuc-nang'),
          api.get('/knowledge'),
          api.get('/database/snapshots'),
        ]);
        setStats({
          chucNang: chucNangRes.data.length,
          knowledge: knowledgeRes.data.length,
          confirmed: knowledgeRes.data.filter((k: any) => k.status === 'confirmed').length,
        });
        const snapshots: SnapshotInfo[] = snapshotRes.data;
        const successSnapshots = snapshots.filter((s) => s.status === 'success');
        if (successSnapshots.length > 0) {
          setSnapshot(successSnapshots[0]);
        } else {
          setSnapshot(null);
        }
      } catch {
        // ignore
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <Title level={4}>Dashboard</Title>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Chức năng"
              value={stats.chucNang}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Knowledge Items"
              value={stats.knowledge}
              prefix={<FileSearchOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="SQL đã tạo"
              value={0}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Knowledge Đã xác nhận"
              value={stats.confirmed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Title level={5}>Schema Snapshot</Title>
        {snapshot ? (
          <Space direction="vertical">
            <Space>
              <Tag color="green">Đã đồng bộ</Tag>
              <Text>Database: {snapshot.databaseName}</Text>
              <Text>Schema: {snapshot.schemaName}</Text>
            </Space>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="Tables" value={snapshot.tableCount} />
              </Col>
              <Col span={8}>
                <Statistic title="Columns" value={snapshot.columnCount} />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Last Sync"
                  value={new Date(snapshot.createdAt).toLocaleString('vi-VN')}
                />
              </Col>
            </Row>
          </Space>
        ) : (
          <Space direction="vertical">
            <Tag color="orange">Chưa đồng bộ</Tag>
            <Text type="secondary">
              Chưa có snapshot nào. Vào trang Tra cứu Database để đồng bộ cấu trúc từ Company Database.
            </Text>
          </Space>
        )}
      </Card>
    </div>
  );
}

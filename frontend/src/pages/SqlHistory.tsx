import { useEffect, useState } from 'react';
import { Card, Typography, Table, Tag, message } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title } = Typography;

interface HistoryItem {
  id: number;
  request: string;
  sql: string;
  status: string;
  type: string;
  executionTime?: number;
  rowCount?: number;
  createdAt: string;
}

const columns = [
  { title: 'Yêu cầu', dataIndex: 'request', key: 'request' },
  { title: 'SQL', dataIndex: 'sql', key: 'sql', ellipsis: true, render: (v: string) => <code style={{ fontSize: 11 }}>{v}</code> },
  { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'success' ? 'green' : 'red'}>{v}</Tag> },
  { title: 'Loại', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color={v === 'read' ? 'blue' : 'red'}>{v}</Tag> },
  { title: 'Rows', dataIndex: 'rowCount', key: 'rowCount' },
  { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => new Date(v).toLocaleString('vi-VN') },
];

export default function SqlHistory() {
  const [data, setData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sql-query/history', { params: { limit: 100 } });
      setData(response.data);
    } catch {
      message.error('Không thể tải lịch sử SQL');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <Title level={4}>
        <HistoryOutlined /> SQL History
      </Title>
      <Card>
        <Table rowKey="id" columns={columns} dataSource={data} pagination={{ pageSize: 20 }} loading={loading} />
      </Card>
    </div>
  );
}

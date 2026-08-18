import { Card, Typography, Table } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const columns = [
  { title: 'Yêu cầu', dataIndex: 'request', key: 'request' },
  { title: 'SQL', dataIndex: 'sql', key: 'sql', ellipsis: true },
  { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
  { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt' },
];

const data = [
  {
    key: '1',
    request: 'Bệnh nhân 81958 bắt đầu khám',
    sql: 'UPDATE public.tb_patientrecord SET isexamined = 1 WHERE patientrecordid = 81958;',
    status: 'generated',
    createdAt: '2026-08-17 16:00',
  },
];

export default function SqlHistory() {
  return (
    <div>
      <Title level={4}>
        <HistoryOutlined /> SQL History
      </Title>
      <Card>
        <Table columns={columns} dataSource={data} pagination={false} />
      </Card>
      <Text type="secondary" style={{ marginTop: 12, display: 'block' }}>
        Lưu lịch sử các câu SQL đã sinh. Không tự động execute.
      </Text>
    </div>
  );
}

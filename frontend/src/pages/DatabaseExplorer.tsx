import { Card, Typography, Table, Tag } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';

const { Title } = Typography;

const columns = [
  { title: 'Tên bảng', dataIndex: 'name', key: 'name' },
  { title: 'Số cột', dataIndex: 'columnCount', key: 'columnCount' },
  { title: 'Mô tả', dataIndex: 'description', key: 'description' },
];

const data = [
  { key: '1', name: 'tb_patientrecord', columnCount: 12, description: 'Bản ghi khám bệnh' },
  { key: '2', name: 'tb_patient', columnCount: 8, description: 'Thông tin bệnh nhân' },
  { key: '3', name: 'tb_doctor', columnCount: 10, description: 'Thông tin bác sĩ' },
];

export default function DatabaseExplorer() {
  return (
    <div>
      <Title level={4}>
        <DatabaseOutlined /> Database Explorer
      </Title>
      <Card>
        <Table columns={columns} dataSource={data} pagination={false} />
      </Card>
      <Tag color="orange" style={{ marginTop: 12 }}>
        Đây là dữ liệu mẫu. Sau này sẽ kết nối HIS PostgreSQL READ-ONLY.
      </Tag>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Card, Typography, Table, Tag, Space, Button, Modal, Form, message, Select, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;

interface KnowledgeItem {
  id: string;
  tableName: string;
  columnName: string;
  meaning: string;
  value?: string;
  status: 'unknown' | 'suggested' | 'confirmed' | 'rejected';
}

export default function Knowledge() {
  const [data, setData] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/knowledge');
      setData(response.data);
    } catch {
      message.error('Không thể tải danh sách knowledge');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: KnowledgeItem) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc muốn xóa knowledge này?',
      onOk: async () => {
        try {
          await api.delete(`/knowledge/${id}`);
          message.success('Đã xóa');
          fetchData();
        } catch {
          message.error('Không thể xóa');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await api.patch(`/knowledge/${editingItem.id}`, values);
        message.success('Đã cập nhật');
      } else {
        await api.post('/knowledge', values);
        message.success('Đã thêm');
      }
      setModalVisible(false);
      fetchData();
    } catch {
      // validation error
    }
  };

  const columns = [
    { title: 'Bảng', dataIndex: 'tableName', key: 'tableName' },
    { title: 'Column', dataIndex: 'columnName', key: 'columnName' },
    { title: 'Ý nghĩa', dataIndex: 'meaning', key: 'meaning' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          confirmed: 'green',
          suggested: 'blue',
          unknown: 'default',
          rejected: 'red',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: KnowledgeItem) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Knowledge</Title>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary">Tổng cộng: {data.length} items</Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Thêm Knowledge
            </Button>
          </div>
          <Table rowKey="id" columns={columns} dataSource={data} pagination={false} loading={loading} />
        </Space>
      </Card>

      <Modal
        title={editingItem ? 'Sửa Knowledge' : 'Thêm Knowledge'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Tên bảng" name="tableName" rules={[{ required: true, message: 'Vui lòng nhập tên bảng' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Tên column" name="columnName" rules={[{ required: true, message: 'Vui lòng nhập tên column' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Ý nghĩa" name="meaning" rules={[{ required: true, message: 'Vui lòng nhập ý nghĩa' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Giá trị (tùy chọn)" name="value">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Trạng thái" name="status" initialValue="suggested">
            <Select
              options={[
                { value: 'unknown', label: 'Unknown' },
                { value: 'suggested', label: 'Suggested' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

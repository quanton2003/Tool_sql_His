import { useEffect, useState } from 'react';
import { Card, Button, Input, Space, Typography, Table, Modal, Form, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title } = Typography;

interface ChucNangItem {
  id: string;
  ten: string;
  moTa: string;
  trangThai: 'active' | 'inactive';
}

export default function ChucNang() {
  const [data, setData] = useState<ChucNangItem[]>([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ChucNangItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = search ? { search } : {};
      const response = await api.get('/chuc-nang', { params });
      setData(response.data);
    } catch {
      message.error('Không thể tải danh sách chức năng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: ChucNangItem) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc muốn xóa chức năng này?',
      onOk: async () => {
        try {
          await api.delete(`/chuc-nang/${id}`);
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
        await api.patch(`/chuc-nang/${editingItem.id}`, values);
        message.success('Đã cập nhật');
      } else {
        await api.post('/chuc-nang', values);
        message.success('Đã thêm');
      }
      setModalVisible(false);
      fetchData();
    } catch {
      // validation error
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Tên chức năng', dataIndex: 'ten', key: 'ten' },
    { title: 'Mô tả', dataIndex: 'moTa', key: 'moTa' },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>{status === 'active' ? 'Hoạt động' : 'Tắt'}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: ChucNangItem) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Chức năng</Title>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <Input
              placeholder="Tìm kiếm chức năng..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 400 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Thêm chức năng
            </Button>
          </div>

          <Table rowKey="id" columns={columns} dataSource={data} pagination={false} loading={loading} />
        </Space>
      </Card>

      <Modal
        title={editingItem ? 'Sửa chức năng' : 'Thêm chức năng'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Tên chức năng" name="ten" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Mô tả" name="moTa" rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Trạng thái" name="trangThai" initialValue="active">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

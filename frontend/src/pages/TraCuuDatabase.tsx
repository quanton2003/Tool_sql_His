import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Input, Table, Tag, Space, Tabs, Empty, Alert, Button, Select, message, Statistic, Row, Col } from 'antd';
import { SearchOutlined, DatabaseOutlined, ReloadOutlined, CloudSyncOutlined, CodeOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string;
  is_primary_key: boolean;
  foreign_key?: string;
}

interface TableInfo {
  table_schema: string;
  table_name: string;
  table_type: string;
  description?: string;
}

interface SnapshotInfo {
  id: number;
  databaseName: string;
  schemaName: string;
  tableCount: number;
  columnCount: number;
  status: string;
  createdAt: string;
}

export default function TraCuuDatabase() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [schemas, setSchemas] = useState<string[]>([]);
  const [selectedSchema, setSelectedSchema] = useState('public');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSnapshot, setHasSnapshot] = useState(false);
  const [latestSnapshot, setLatestSnapshot] = useState<SnapshotInfo | null>(null);

  const fetchSchemas = async () => {
    try {
      const response = await api.get('/database/schemas');
      const schemaNames = response.data.map((s: { schema_name: string }) => s.schema_name);
      setSchemas(schemaNames);
    } catch {
      message.error('Không thể tải danh sách schema');
    }
  };

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await api.get('/database/tables', { params: { schema: selectedSchema } });
      setTables(response.data);
    } catch {
      message.error('Không thể tải danh sách bảng');
    } finally {
      setLoading(false);
    }
  };

  const fetchColumns = async (tableName: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/database/tables/${tableName}/columns`, { params: { schema: selectedSchema } });
      setColumns(response.data);
    } catch {
      message.error('Không thể tải thông tin columns');
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = (table: TableInfo) => {
    setSelectedTable(table);
    fetchColumns(table.table_name);
  };

  const handleOpenInSqlQuery = (table: TableInfo) => {
    const sql = `SELECT * FROM public.${table.table_name} LIMIT 100;`;
    navigate('/app/sql-query', { state: { sql } });
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      fetchTables();
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/database/tables/search', { params: { q: search, schema: selectedSchema } });
      setTables(response.data);
    } catch {
      message.error('Không thể tìm kiếm bảng');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckConnection = async () => {
    setLoading(true);
    try {
      const response = await api.post('/database/company/test-connection');
      if (response.data.connected) {
        message.success('Kết nối Company Database thành công');
      } else {
        message.error('Kết nối Company Database thất bại');
      }
    } catch {
      message.error('Kết nối Company Database thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSchema = async () => {
    setLoading(true);
    try {
      const settingsResponse = await api.get('/settings');
      const settings = settingsResponse.data;
      const databaseName = settings['HIS_DB_NAME'] || 'test_bvducgiang';
      const response = await api.post('/database/company/sync-schema', {
        databaseName,
        schemaName: selectedSchema,
      });
      if (response.data.status === 'success') {
        message.success('Đồng bộ cấu trúc thành công');
        await checkSnapshot();
      } else {
        message.error(response.data.error || 'Đồng bộ thất bại');
      }
    } catch {
      message.error('Đồng bộ cấu trúc thất bại');
    } finally {
      setLoading(false);
    }
  };

  const checkSnapshot = async () => {
    try {
      const response = await api.get('/database/snapshots');
      const snapshots: SnapshotInfo[] = response.data;
      const successSnapshots = snapshots.filter((s) => s.status === 'success');
      if (successSnapshots.length > 0) {
        setHasSnapshot(true);
        setLatestSnapshot(successSnapshots[0]);
      } else {
        setHasSnapshot(false);
        setLatestSnapshot(null);
      }
    } catch {
      setHasSnapshot(false);
    }
  };

  useEffect(() => {
    checkSnapshot();
  }, []);

  useEffect(() => {
    if (hasSnapshot) {
      fetchSchemas();
      fetchTables();
    }
  }, [selectedSchema, hasSnapshot]);

  useEffect(() => {
    if (hasSnapshot && selectedTable) {
      fetchColumns(selectedTable.table_name);
    }
  }, [hasSnapshot, selectedTable]);

  const tableColumns = [
    { title: 'Tên bảng', dataIndex: 'table_name', key: 'table_name', render: (text: string) => <a onClick={() => handleTableClick({ table_name: text, table_schema: selectedSchema, table_type: 'BASE TABLE' } as TableInfo)}>{text}</a> },
    { title: 'Schema', dataIndex: 'table_schema', key: 'table_schema' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: TableInfo) => (
        <Button type="link" size="small" icon={<CodeOutlined />} onClick={() => handleOpenInSqlQuery(record)}>
          SQL Query
        </Button>
      ),
    },
  ];

  const columnColumns = [
    { title: 'Tên column', dataIndex: 'column_name', key: 'column_name' },
    { title: 'Data Type', dataIndex: 'data_type', key: 'data_type' },
    { title: 'Nullable', dataIndex: 'is_nullable', key: 'is_nullable', render: (val: string) => <Tag color={val === 'NO' ? 'red' : 'green'}>{val}</Tag> },
    { title: 'Primary Key', dataIndex: 'is_primary_key', key: 'is_primary_key', render: (val: boolean) => val ? <Tag color="blue">PK</Tag> : '-' },
    { title: 'Foreign Key', dataIndex: 'foreign_key', key: 'foreign_key', render: (val?: string) => val ? <Tag color="orange">{val}</Tag> : '-' },
  ];

  return (
    <div>
      <Title level={4}>
        <DatabaseOutlined /> Tra cứu Database HIS
      </Title>

      <Alert
        message="🔒 READ ONLY"
        description="Database công ty chỉ được sử dụng để đọc cấu trúc. Ứng dụng không thực hiện các lệnh thay đổi dữ liệu."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {hasSnapshot && latestSnapshot && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="Snapshot cuối" value={`#${latestSnapshot.id}`} />
            </Col>
            <Col span={8}>
              <Statistic title="Tables" value={latestSnapshot.tableCount} />
            </Col>
            <Col span={8}>
              <Statistic title="Columns" value={latestSnapshot.columnCount} />
            </Col>
          </Row>
          <Text type="secondary">
            Thời gian: {new Date(latestSnapshot.createdAt).toLocaleString('vi-VN')}
          </Text>
        </Card>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Space>
              <Button onClick={handleCheckConnection} loading={loading} icon={<ReloadOutlined />}>
                Kiểm tra kết nối Company DB
              </Button>
              <Button type="primary" onClick={handleSyncSchema} loading={loading} icon={<CloudSyncOutlined />}>
                Đồng bộ cấu trúc
              </Button>
            </Space>
          </div>

          {hasSnapshot ? (
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Select
                  value={selectedSchema}
                  onChange={setSelectedSchema}
                  style={{ minWidth: 150 }}
                  options={schemas.map((s) => ({ value: s, label: s }))}
                />
                <Input
                  placeholder="Tìm kiếm tên bảng..."
                  prefix={<SearchOutlined />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onPressEnter={handleSearch}
                  style={{ maxWidth: 300 }}
                />
                <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
                  Tìm kiếm
                </Button>
              </div>

              <Tabs
                defaultActiveKey="tables"
                items={[
                  {
                    key: 'tables',
                    label: `Danh sách bảng (${tables.length})`,
                    children: (
                      <Table rowKey="table_name" columns={tableColumns} dataSource={tables} pagination={false} loading={loading} />
                    ),
                  },
                  {
                    key: 'selected',
                    label: selectedTable ? `Columns - ${selectedTable.table_name}` : 'Chi tiết bảng',
                    children: selectedTable ? (
                      <Table rowKey="column_name" columns={columnColumns} dataSource={columns} pagination={false} loading={loading} />
                    ) : (
                      <Empty description="Chọn một bảng để xem chi tiết" />
                    ),
                  },
                ]}
              />
            </Space>
          ) : (
            <Empty description="Chưa có snapshot. Vui lòng đồng bộ cấu trúc từ Company Database." />
          )}
        </Space>
      </Card>
    </div>
  );
}

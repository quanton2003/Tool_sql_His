import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout, Button, Table, Tag, Space, Typography, message, Drawer, Tooltip, Alert, Statistic, Row, Col, Tree } from 'antd';
import { PlayCircleOutlined, ClearOutlined, FormatPainterOutlined, DatabaseOutlined, HistoryOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import api from '../services/api';

declare const monaco: any;

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

interface ColumnDef {
  title: string;
  dataIndex: string;
  key: string;
  render?: (text: any) => React.ReactNode;
}

interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTime: number;
}

interface SchemaItem {
  id: number;
  name: string;
}

interface TableItem {
  id: number;
  schemaId: number;
  name: string;
}

interface ColumnItem {
  id: number;
  tableId: number;
  name: string;
  type: string;
  isPk: boolean;
  fk?: string;
}

interface RelationItem {
  tableId: number;
  column: string;
  foreignTable: string;
  foreignColumn: string;
}

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

export default function SqlQuery() {
  const location = useLocation();
  const [sql, setSql] = useState('SELECT current_database() AS db, current_user AS usr, version() AS pg_version;');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [schemaData, setSchemaData] = useState<{ schemas: SchemaItem[]; tables: TableItem[]; columns: ColumnItem[]; relations: RelationItem[] }>({ schemas: [], tables: [], columns: [], relations: [] });
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (location.state?.sql) {
      setSql(location.state.sql);
      editorRef.current?.setValue(location.state.sql);
    }
  }, [location.state]);

  const fetchSchema = async () => {
    try {
      const [schemaRes, historyRes] = await Promise.all([
        api.get('/sql-query/schema'),
        api.get('/sql-query/history', { params: { limit: 100 } }),
      ]);
      setSchemaData(schemaRes.data);
      setHistory(historyRes.data);
    } catch {
      message.error('Không thể tải schema data');
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  const handleExecute = async () => {
    if (!sql.trim()) {
      message.warning('Vui lòng nhập SQL');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await api.post('/sql-query/execute', { sql, request: sql });
      setResult(response.data.result);
      message.success(`Thực thi thành công. ${response.data.result.rowCount} rows.`);
      fetchSchema();
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || error.message || 'Lỗi thực thi SQL';
      if (errMsg.includes('permission denied')) {
        message.error('Lỗi quyền truy cập: User PostgreSQL hiện tại không có quyền SELECT trên bảng này. Vui lòng cấp quyền SELECT trong PostgreSQL hoặc dùng user có quyền cao hơn.');
      } else {
        message.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSql('');
    setResult(null);
    editorRef.current?.setValue('');
  };

  const handleFormat = () => {
    const formatted = sql
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ',\n  ')
      .replace(/\bSELECT\b/gi, 'SELECT\n  ')
      .replace(/\bFROM\b/gi, '\nFROM')
      .replace(/\bWHERE\b/gi, '\nWHERE')
      .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
      .replace(/\bORDER BY\b/gi, '\nORDER BY')
      .replace(/\bLIMIT\b/gi, '\nLIMIT')
      .replace(/\bJOIN\b/gi, '\nJOIN')
      .replace(/\bON\b/gi, '\n  ON')
      .replace(/\bAND\b/gi, '\n  AND')
      .replace(/\bOR\b/gi, '\n  OR')
      .trim();
    setSql(formatted);
    editorRef.current?.setValue(formatted);
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleExecute();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleFormat();
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleTableClick = (tableName: string) => {
    const sqlText = `SELECT * FROM public.${tableName} LIMIT 100;`;
    setSql(sqlText);
    editorRef.current?.setValue(sqlText);
  };

  const handleColumnClick = (tableName: string, columnName: string) => {
    const sqlText = sql + (sql.trim() ? ', ' : 'SELECT ') + columnName + ` FROM public.${tableName}`;
    setSql(sqlText);
    editorRef.current?.setValue(sqlText);
  };

  const renderResultColumns = (): ColumnDef[] => {
    if (!result) return [];
    return result.columns.map((col) => ({
      title: col,
      dataIndex: col,
      key: col,
      ellipsis: true,
      render: (text: any) => {
        if (text === null || text === undefined) return <Text type="secondary">NULL</Text>;
        if (typeof text === 'object') return <Text code>{JSON.stringify(text)}</Text>;
        return String(text);
      },
    }));
  };

  const groupedTables = schemaData.schemas.map((schema) => ({
    title: schema.name,
    key: `schema-${schema.id}`,
    children: schemaData.tables
      .filter((t) => t.schemaId === schema.id)
      .map((table) => ({
        title: table.name,
        key: `table-${table.id}`,
        children: schemaData.columns
          .filter((c) => c.tableId === table.id)
          .map((col) => ({
            title: (
              <Space>
                {col.isPk && <Tag color="blue" style={{ fontSize: 10 }}>PK</Tag>}
                {col.fk && <Tag color="orange" style={{ fontSize: 10 }}>FK</Tag>}
                <span>{col.name}</span>
              </Space>
            ),
            key: `col-${col.id}`,
            tableName: table.name,
            isLeaf: true,
          })),
      })),
  }));

  const handleTreeSelect = (_selectedKeys: React.Key[], info: any) => {
    const node = info.node;
    const key = node.key as string;
    if (key.startsWith('table-')) {
      handleTableClick(node.title as string);
    } else if (key.startsWith('col-')) {
      handleColumnClick(node.tableName, node.title as string);
    }
  };

  const historyColumns = [
    { title: 'Time', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (v: string) => new Date(v).toLocaleString('vi-VN') },
    { title: 'SQL', dataIndex: 'sql', key: 'sql', ellipsis: true, render: (v: string) => <code style={{ fontSize: 11 }}>{v}</code> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'success' ? 'green' : 'red'}>{v}</Tag> },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color={v === 'read' ? 'blue' : 'red'}>{v}</Tag> },
    { title: 'Rows', dataIndex: 'rowCount', key: 'rowCount' },
    { title: 'Time(ms)', dataIndex: 'executionTime', key: 'executionTime' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={280} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}>
          <Title level={5} style={{ margin: 0 }}>
            <DatabaseOutlined /> Database Explorer
          </Title>
        </div>
        <div style={{ padding: 8 }}>
          <Tree
            showLine
            defaultExpandAll
            treeData={groupedTables}
            onSelect={handleTreeSelect}
          />
        </div>
      </Sider>

      <Content style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 12, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleExecute} loading={loading}>
              Execute (Ctrl+Enter)
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClear}>Clear</Button>
            <Button icon={<FormatPainterOutlined />} onClick={handleFormat}>Format</Button>
            <Button icon={<HistoryOutlined />} onClick={() => setHistoryDrawerOpen(true)}>History</Button>
          </Space>
          <Space>
            <Tooltip title="Copy SQL">
              <Button icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={() => handleCopy(sql)} />
            </Tooltip>
          </Space>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 300, borderBottom: '1px solid #f0f0f0' }}>
            <Editor
              height="100%"
              defaultLanguage="sql"
              theme="vs-dark"
              value={sql}
              onChange={(v) => setSql(v || '')}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                folding: true,
                formatOnPaste: true,
              }}
            />
          </div>

          {result && (
            <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
              <Row gutter={16} style={{ marginBottom: 12 }}>
                <Col span={6}>
                  <Statistic title="Rows" value={result.rowCount} />
                </Col>
                <Col span={6}>
                  <Statistic title="Columns" value={result.columns.length} />
                </Col>
                <Col span={6}>
                  <Statistic title="Time" value={result.executionTime} suffix="ms" />
                </Col>
                <Col span={6}>
                  <Button icon={<CopyOutlined />} onClick={() => handleCopy(JSON.stringify(result.rows, null, 2))}>Copy JSON</Button>
                </Col>
              </Row>

              <Alert
                message="READ ONLY"
                description="Kết quả từ PostgreSQL HIS Database. Không thực hiện lệnh ghi."
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
              />

              <Table
                rowKey={(r, i) => `${i}-${JSON.stringify(r).slice(0, 50)}`}
                columns={renderResultColumns()}
                dataSource={result.rows}
                pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: ['10', '50', '100', '500'] }}
                size="small"
                scroll={{ x: true, y: 400 }}
              />
            </div>
          )}

          {!result && !loading && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text type="secondary">Nhập SQL và nhấn Execute để chạy query</Text>
            </div>
          )}
        </div>
      </Content>

      <Drawer title="SQL History" placement="right" width={600} open={historyDrawerOpen} onClose={() => setHistoryDrawerOpen(false)}>
        <Table rowKey="id" columns={historyColumns} dataSource={history} pagination={{ pageSize: 20 }} size="small" />
      </Drawer>
    </Layout>
  );
}

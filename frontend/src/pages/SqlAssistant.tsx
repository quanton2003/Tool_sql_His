import { useState } from 'react';
import { Card, Input, Button, Typography, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function SqlAssistant() {
  const [request, setRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sql: string; explanation: string } | null>(null);

  const handleGenerate = async () => {
    if (!request.trim()) {
      message.warning('Vui lòng nhập yêu cầu');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await api.post('/sql-query/ai/generate', {
        request,
      });
      setResult(response.data);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể tạo SQL. Hãy đồng bộ schema trước.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.sql) {
      navigator.clipboard.writeText(result.sql);
      message.success('Đã copy SQL vào clipboard');
    }
  };

  return (
    <div>
      <Title level={4}>SQL Assistant</Title>
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={5}>Bạn muốn làm gì?</Title>
            <TextArea
              rows={3}
              placeholder="Ví dụ: Bệnh nhân 81958 bắt đầu khám"
              value={request}
              onChange={(e) => setRequest(e.target.value)}
            />
          </div>
          <Button type="primary" onClick={handleGenerate} loading={loading} block>
            Generate SQL
          </Button>
        </Space>
      </Card>

      {result && (
        <Card>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Title level={5}>SQL được đề xuất:</Title>
              <pre style={styles.sqlBlock}>{result.sql}</pre>
              <Button icon={<CopyOutlined />} onClick={handleCopy} style={{ marginTop: 8 }}>
                Copy SQL
              </Button>
            </div>
            <div>
              <Title level={5}>Giải thích:</Title>
              <Paragraph>{result.explanation}</Paragraph>
            </div>
            <Tag color="orange">⚠ SQL chỉ được sinh ra để kiểm tra. Không tự động thực thi trên HIS.</Tag>
          </Space>
        </Card>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sqlBlock: {
    background: '#0b161c',
    color: '#bfe7df',
    border: '1px solid #2d5559',
    padding: 12,
    borderRadius: 6,
    overflow: 'auto',
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};

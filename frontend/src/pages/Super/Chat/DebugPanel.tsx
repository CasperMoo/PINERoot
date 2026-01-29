import React from 'react';
import { Select, Card, Space, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ModelConfig } from '@/api/chat';
import type { PersonaTemplate } from '@/api/persona';

interface DebugPanelProps {
  models: ModelConfig[];
  personas: PersonaTemplate[];
  currentModelId: string | null;
  currentPersonaId: number | null;
  onModelChange: (modelId: string) => void;
  onPersonaChange: (personaId: number) => void;
  onCreatePersona?: () => void;
  disabled?: boolean;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  models,
  personas,
  currentModelId,
  currentPersonaId,
  onModelChange,
  onPersonaChange,
  onCreatePersona,
  disabled,
}) => {
  return (
    <Card size="small" className="mb-4">
      <Space size="large" wrap>
        <div>
          <span className="mr-2 text-gray-600">模型:</span>
          <Select
            style={{ width: 200 }}
            value={currentModelId || undefined}
            onChange={onModelChange}
            disabled={disabled}
            placeholder="选择模型"
            options={models.map((m) => ({
              label: m.name,
              value: m.id,
            }))}
          />
        </div>
        <div>
          <span className="mr-2 text-gray-600">人设:</span>
          <Select
            style={{ width: 200 }}
            value={currentPersonaId || undefined}
            onChange={onPersonaChange}
            disabled={disabled}
            placeholder="选择人设"
            allowClear
            options={personas.map((p) => ({
              label: p.name,
              value: p.id,
            }))}
          />
        </div>
        {onCreatePersona && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreatePersona}
            disabled={disabled}
          >
            创建人设
          </Button>
        )}
      </Space>
    </Card>
  );
};

export default DebugPanel;

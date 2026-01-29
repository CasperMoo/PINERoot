import React from 'react';
import { Select, Card, Space } from 'antd';
import { ModelConfig } from '../../../api/chat';
import { PersonaTemplate } from '../../../api/persona';

interface DebugPanelProps {
  models: ModelConfig[];
  personas: PersonaTemplate[];
  currentModelId: string | null;
  currentPersonaId: number | null;
  onModelChange: (modelId: string) => void;
  onPersonaChange: (personaId: number) => void;
  disabled?: boolean;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  models,
  personas,
  currentModelId,
  currentPersonaId,
  onModelChange,
  onPersonaChange,
  disabled,
}) => {
  return (
    <Card size="small" className="mb-4">
      <Space size="large">
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
      </Space>
    </Card>
  );
};

export default DebugPanel;

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Card, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { PersonaTemplate } from '@/api/persona';
import { createPersonaTemplate } from '@/api/persona';

const { TextArea } = Input;

interface CreatePersonaModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (personaId: number) => void;
  personas: PersonaTemplate[];
}

export const PERSONA_PRESETS = [
  {
    name: '温柔倾听者',
    description: '温暖陪伴，善于倾听和理解用户的心声',
    prompt: '你是一个温暖、善解人意的朋友，愿意倾听用户的心声，给予情感支持和陪伴。请用温和、真诚的语气与用户交流，像一个知心朋友一样。'
  },
  {
    name: '专业顾问',
    description: '提供专业建议和深度分析',
    prompt: '你是一位专业顾问，能够提供深入的分析和建议。请用专业、客观的语气回答问题，并在适当时候提出启发性问题。'
  },
  {
    name: '幽默伙伴',
    description: '轻松愉快，幽默风趣的聊天伙伴',
    prompt: '你是一个幽默风趣的聊天伙伴，喜欢用轻松愉快的方式交流。可以适当使用幽默和玩笑，让对话更加生动有趣。'
  },
  {
    name: '学习助手',
    description: '知识问答和学习辅导',
    prompt: '你是一个耐心的学习助手，擅长解释复杂概念，帮助用户理解各种知识点。请用清晰易懂的语言解释，并根据用户的理解程度调整表达方式。'
  },
  {
    name: '健身教练',
    description: '运动指导和健康建议',
    prompt: '你是一位专业的健身教练，能够提供运动指导和健康建议。请以鼓励的态度帮助用户建立健康的生活习惯，并给出科学合理的训练建议。'
  }
];

const CreatePersonaModal: React.FC<CreatePersonaModalProps> = ({
  open,
  onCancel,
  onSuccess,
  personas,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setSelectedPreset(null);
    }
  }, [open, form]);

  const handlePresetClick = (index: number) => {
    setSelectedPreset(index);
    const preset = PERSONA_PRESETS[index];
    form.setFieldsValue({
      name: preset.name,
      description: preset.description,
      prompt: preset.prompt,
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Check for duplicate name
      const isDuplicate = personas.some(
        (p) => p.name === values.name && p.id !== undefined
      );
      if (isDuplicate) {
        message.warning('人设名称已存在，请使用其他名称');
        setLoading(false);
        return;
      }

      const result = await createPersonaTemplate({
        name: values.name,
        description: values.description,
        prompt: values.prompt,
      });

      message.success('人设创建成功');
      onSuccess(result.id);
      onCancel();
    } catch (error) {
      console.error('Failed to create persona:', error);
      message.error('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="创建人设"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
        <div className="space-y-4">
          {/* 预设卡片区 */}
          <div>
            <div className="text-sm text-gray-600 mb-2">选择预设模板（可选）</div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {PERSONA_PRESETS.map((preset, index) => (
                <Card
                  key={index}
                  size="small"
                  hoverable
                  className={`min-w-[140px] cursor-pointer transition-all ${
                    selectedPreset === index
                      ? 'border-blue-500 border-2'
                      : 'border border-gray-200'
                  }`}
                  onClick={() => handlePresetClick(index)}
                >
                  <div className="text-sm font-medium">{preset.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {preset.description}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 表单区 */}
          <Form form={form} layout="vertical" autoComplete="off">
            <Form.Item
              name="name"
              label="名称"
              rules={[
                { required: true, message: '请输入人设名称' },
                { min: 1, max: 100, message: '名称长度为 1-100 个字符' },
              ]}
            >
              <Input placeholder="如：温柔倾听者" maxLength={100} />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述（可选）"
              rules={[{ max: 500, message: '描述最多 500 个字符' }]}
            >
              <TextArea
                placeholder="简单描述这个人设的特点"
                autoSize={{ minRows: 2, maxRows: 3 }}
                maxLength={500}
              />
            </Form.Item>

            <Form.Item
              name="prompt"
              label="提示词"
              rules={[
                { required: true, message: '请输入提示词' },
                { min: 1, max: 10000, message: '提示词长度为 1-10000 个字符' },
              ]}
            >
              <TextArea
                placeholder="AI 的系统提示，定义这个角色的行为和说话方式"
                autoSize={{ minRows: 6, maxRows: 10 }}
                maxLength={10000}
              />
            </Form.Item>
          </Form>

          {/* 底部按钮 */}
          <div className="flex justify-end gap-2">
            <Button onClick={onCancel} disabled={loading}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              icon={<PlusOutlined />}
            >
              创建
            </Button>
          </div>
        </div>
      </Modal>
  );
};

export default CreatePersonaModal;

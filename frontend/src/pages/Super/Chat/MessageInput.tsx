import React, { useState, useCallback } from 'react';
import { Input, Button, Space, Popconfirm } from 'antd';
import { SendOutlined, DeleteOutlined, StopOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface MessageInputProps {
  onSend: (content: string) => void;
  onClear: () => void;
  onAbort: () => void;
  sending: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onClear,
  onAbort,
  sending,
}) => {
  const [input, setInput] = useState('');

  const handleSend = useCallback(() => {
    const content = input.trim();
    if (content) {
      onSend(content);
      setInput('');
    }
  }, [input, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="border-t p-4 bg-white">
      <div className="flex gap-2">
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (Shift+Enter 换行)"
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={sending}
          className="flex-1"
        />
        <Space direction="vertical" size="small">
          {sending ? (
            <Button
              type="primary"
              danger
              icon={<StopOutlined />}
              onClick={onAbort}
            >
              停止
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!input.trim()}
            >
              发送
            </Button>
          )}
          <Popconfirm
            title="确定要清空所有聊天记录吗？"
            description="此操作不可恢复"
            onConfirm={onClear}
            okText="确定"
            cancelText="取消"
          >
            <Button icon={<DeleteOutlined />} disabled={sending}>
              清空
            </Button>
          </Popconfirm>
        </Space>
      </div>
    </div>
  );
};

export default MessageInput;

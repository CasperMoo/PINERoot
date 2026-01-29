import React, { useEffect } from 'react';
import { App, Spin } from 'antd';
import DebugPanel from './DebugPanel';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import { useSession } from './hooks/useSession';
import { useChat } from './hooks/useChat';

const ChatPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const {
    session,
    models,
    personas,
    loading: sessionLoading,
    changeModel,
    changePersona,
    refresh: refreshSession,
  } = useSession();

  const {
    messages,
    hasMore,
    loading: messagesLoading,
    sending,
    streamingContent,
    loadMessages,
    loadMore,
    sendMessage,
    clear,
    abort,
  } = useChat();

  // Load messages when session is ready
  useEffect(() => {
    if (session) {
      loadMessages();
    }
  }, [session, loadMessages]);

  const handleModelChange = async (modelId: string) => {
    try {
      await changeModel(modelId);
      messageApi.success('模型已切换');
    } catch {
      messageApi.error('切换模型失败');
    }
  };

  const handlePersonaChange = async (personaId: number) => {
    try {
      await changePersona(personaId);
      messageApi.success('人设已切换');
    } catch {
      messageApi.error('切换人设失败');
    }
  };

  const handleClear = async () => {
    try {
      await clear();
      await refreshSession();
      messageApi.success('聊天记录已清空');
    } catch {
      messageApi.error('清空失败');
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-4 pb-0">
        <DebugPanel
          models={models}
          personas={personas}
          currentModelId={session?.modelId || null}
          currentPersonaId={session?.personaId || null}
          onModelChange={handleModelChange}
          onPersonaChange={handlePersonaChange}
          disabled={sending}
        />
      </div>

      <ChatWindow
        messages={messages}
        streamingContent={streamingContent}
        loading={messagesLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
      />

      <MessageInput
        onSend={sendMessage}
        onClear={handleClear}
        onAbort={abort}
        sending={sending}
      />
    </div>
  );
};

export default ChatPage;

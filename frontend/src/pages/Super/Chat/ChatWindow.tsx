import React, { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import type { ChatMessage } from '@/api/chat';

interface ChatWindowProps {
  messages: ChatMessage[];
  streamingContent: string;
  loading: boolean;
  hasMore: boolean;
  isThinking: boolean;
  error: string | null;
  onLoadMore: () => void;
  onRetry?: (content: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  streamingContent,
  loading,
  hasMore,
  isThinking,
  error,
  onLoadMore,
  onRetry,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, isThinking, error]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop } = containerRef.current;
      if (scrollTop === 0 && hasMore && !loading) {
        onLoadMore();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      onScroll={handleScroll}
    >
      {loading && (
        <div className="text-center py-4">
          <Spin />
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[70%] p-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            <p className="text-xs mt-1 opacity-70">
              {new Date(msg.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}

      {streamingContent && (
        <div className="flex justify-start">
          <div className="max-w-[70%] p-3 rounded-lg bg-gray-100 text-gray-800">
            <p className="whitespace-pre-wrap break-words">{streamingContent}</p>
            <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
          </div>
        </div>
      )}

      {/* Thinking indicator with animated dots */}
      {isThinking && (
        <div className="flex justify-start">
          <div className="max-w-[70%] p-3 rounded-lg bg-gray-100 text-gray-800">
            <div className="flex items-center space-x-1">
              <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      {/* Error message with retry button */}
      {error && (
        <div className="flex justify-start">
          <div className="max-w-[70%] p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center space-x-2">
              <span className="text-red-600 text-sm">{error}</span>
              {onRetry && messages.length > 0 && (
                <button
                  onClick={() => onRetry(messages[messages.length - 1].content)}
                  className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  重试
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default ChatWindow;

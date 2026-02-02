import { useState, useCallback, useRef } from 'react';
import {
  getMessages,
  clearHistory,
  sendMessageStream,
} from '@/api/chat';
import type { ChatMessage } from '@/api/chat';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isThinking, setIsThinking] = useState(false); // New state for "thinking" indicator
  const [error, setError] = useState<string | null>(null); // New state for error handling
  const abortRef = useRef<(() => void) | null>(null);

  const loadMessages = useCallback(async (before?: number) => {
    setLoading(true);
    try {
      const res = await getMessages({ limit: 50, before });
      if (before) {
        setMessages((prev) => [...res.messages, ...prev]);
      } else {
        setMessages(res.messages);
      }
      setHasMore(res.hasMore);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (messages.length > 0 && hasMore) {
      loadMessages(messages[0].id);
    }
  }, [messages, hasMore, loadMessages]);

  const sendMessage = useCallback(async (content: string) => {
    setSending(true);
    setIsThinking(true); // Show thinking indicator
    setError(null); // Clear previous errors
    setStreamingContent('');

    // Add user message optimistically
    const tempUserMessage: ChatMessage = {
      id: Date.now(),
      sessionId: 0,
      role: 'user',
      content,
      modelId: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      let assistantContent = '';
      let firstChunkReceived = false;

      abortRef.current = sendMessageStream(
        content,
        (chunk) => {
          // Hide thinking indicator when first chunk arrives
          if (!firstChunkReceived) {
            setIsThinking(false);
            firstChunkReceived = true;
          }
          assistantContent += chunk;
          setStreamingContent(assistantContent);
        },
        () => {
          // On done, add assistant message
          const assistantMessage: ChatMessage = {
            id: Date.now() + 1,
            sessionId: 0,
            role: 'assistant',
            content: assistantContent,
            modelId: null,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingContent('');
          setSending(false);
          setIsThinking(false);
          abortRef.current = null;
        },
        (error) => {
          console.error('Chat error:', error);
          setIsThinking(false);
          setSending(false);
          setError(error instanceof Error ? error.message : '发送消息失败，请重试');
          abortRef.current = null;
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsThinking(false);
      setSending(false);
      setError(error instanceof Error ? error.message : '发送消息失败，请重试');
    }
  }, []);

  const clear = useCallback(async () => {
    try {
      await clearHistory();
      setMessages([]);
      setHasMore(false);
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw error;
    }
  }, []);

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
      setSending(false);
      setIsThinking(false);
      setStreamingContent('');
    }
  }, []);

  // Add retry function
  const retry = useCallback(async (content: string) => {
    setError(null);
    await sendMessage(content);
  }, [sendMessage]);

  return {
    messages,
    hasMore,
    loading,
    sending,
    streamingContent,
    isThinking,
    error,
    loadMessages,
    loadMore,
    sendMessage,
    clear,
    abort,
    retry,
  };
}

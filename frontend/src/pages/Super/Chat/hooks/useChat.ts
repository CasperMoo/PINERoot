import { useState, useCallback, useRef } from 'react';
import {
  getMessages,
  clearHistory,
  sendMessageStream,
  ChatMessage,
} from '@/api/chat';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
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

      abortRef.current = sendMessageStream(
        content,
        (chunk) => {
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
          abortRef.current = null;
        },
        (error) => {
          console.error('Chat error:', error);
          setSending(false);
          abortRef.current = null;
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setSending(false);
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
      setStreamingContent('');
    }
  }, []);

  return {
    messages,
    hasMore,
    loading,
    sending,
    streamingContent,
    loadMessages,
    loadMore,
    sendMessage,
    clear,
    abort,
  };
}

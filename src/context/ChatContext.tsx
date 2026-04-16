import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { socketService, SocketEvents, type MessageReceivePayload, type MessageEditPayload, type MessageDeletePayload, type TypingUpdatePayload } from '@/services/socket';
import { getMessages, getUnreadCount, markMessagesAsRead as apiMarkMessagesAsRead } from '@/services/chat';
import type { ChatMessage } from '@/types/chat';
import type { Project } from '@/types/project';

interface TypingIndicator {
  userId: string;
  userName: string;
}

interface ChatContextType {
  messages: ChatMessage[];
  unreadCount: number;
  typingUsers: Map<string, TypingIndicator>;
  isLoading: boolean;
  hasMore: boolean;
  isConnected: boolean;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  sendMessage: (content: string, replyToId?: string) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  loadMoreMessages: () => Promise<void>;
  markAsRead: () => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  setActiveProject: (project: Project | null) => void;
  lastMessage: ChatMessage | null;
  clearLastMessage: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingIndicator>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lastMessage, setLastMessage] = useState<ChatMessage | null>(null);

  const typingTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const oldestMessageIdRef = useRef<string | null>(null);
  const currentUserId = user?.id ?? '';

  const fetchMessages = useCallback(async (projectId: string, before?: string) => {
    try {
      const result = await getMessages(projectId, { limit: 50, before });
      if (before) {
        setMessages((prev) => [...result.messages, ...prev]);
      } else {
        setMessages(result.messages);
      }
      setHasMore(result.hasMore);
      if (result.messages.length > 0 && !before) {
        oldestMessageIdRef.current = result.messages[0].id;
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, []);

  const fetchUnreadCount = useCallback(async (projectId: string) => {
    try {
      const count = await getUnreadCount(projectId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      socketService.disconnect();
      setIsConnected(false);
      setMessages([]);
      setUnreadCount(0);
      return;
    }

    socketService.connect();

    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);

    socketService.on('connected', handleConnected);
    socketService.on('disconnected', handleDisconnected);

    if (socketService.isConnected()) setIsConnected(true);

    return () => {
      socketService.off('connected', handleConnected);
      socketService.off('disconnected', handleDisconnected);
    };
  }, [user]);

  useEffect(() => {
    if (!activeProject || !isConnected) return;

    const initProjectChat = async () => {
      setIsLoading(true);
      await socketService.joinProject(activeProject.id);
      await fetchMessages(activeProject.id);
      await fetchUnreadCount(activeProject.id);
      setIsLoading(false);
    };

    initProjectChat();

    return () => {
      socketService.leaveProject();
    };
  }, [activeProject, isConnected, fetchMessages, fetchUnreadCount]);

  useEffect(() => {
    if (!isConnected) return;

    const handleMessageReceive = (payload: MessageReceivePayload) => {
      const { message } = payload;
      if (activeProject && message.projectId === activeProject.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });

        if (message.senderId !== currentUserId) {
          setUnreadCount((prev) => prev + 1);
          setLastMessage(message);
          
          if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('New message', {
              body: `${message.sender?.name || message.sender?.email}: ${message.content.slice(0, 50)}`,
              icon: '/favicon.ico',
            });
          }
        }
      }
    };

    const handleMessageEdit = (payload: MessageEditPayload) => {
      const { message } = payload;
      setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
    };

    const handleMessageDelete = (payload: MessageDeletePayload) => {
      const { messageId } = payload;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    const handleTypingUpdate = (payload: TypingUpdatePayload) => {
      const { userId, userName, isTyping, projectId } = payload;
      if (activeProject && projectId !== activeProject.id) return;
      if (userId === currentUserId) return;

      setTypingUsers((prev) => {
        const next = new Map(prev);
        const existingTimeout = typingTimeoutRefs.current.get(userId);
        if (existingTimeout) clearTimeout(existingTimeout);

        if (isTyping) {
          next.set(userId, { userId, userName });
          const timeout = setTimeout(() => {
            setTypingUsers((p) => {
              const n = new Map(p);
              n.delete(userId);
              return n;
            });
            typingTimeoutRefs.current.delete(userId);
          }, 5000);
          typingTimeoutRefs.current.set(userId, timeout);
        } else {
          next.delete(userId);
        }
        return next;
      });
    };

    socketService.on(SocketEvents.MESSAGE_RECEIVE, handleMessageReceive);
    socketService.on(SocketEvents.MESSAGE_EDIT, handleMessageEdit);
    socketService.on(SocketEvents.MESSAGE_DELETE, handleMessageDelete);
    socketService.on(SocketEvents.TYPING_UPDATE, handleTypingUpdate);

    return () => {
      socketService.off(SocketEvents.MESSAGE_RECEIVE, handleMessageReceive);
      socketService.off(SocketEvents.MESSAGE_EDIT, handleMessageEdit);
      socketService.off(SocketEvents.MESSAGE_DELETE, handleMessageDelete);
      socketService.off(SocketEvents.TYPING_UPDATE, handleTypingUpdate);
    };
  }, [isConnected, activeProject, currentUserId, notificationsEnabled]);

  const sendMessage = useCallback((content: string, replyToId?: string) => {
    if (!activeProject) return;
    socketService.sendMessage({ projectId: activeProject.id, content, replyToId });
  }, [activeProject]);

  const editMessage = useCallback((messageId: string, content: string) => {
    if (!activeProject) return;
    socketService.editMessage({ projectId: activeProject.id, messageId, content });
  }, [activeProject]);

  const deleteMessage = useCallback((messageId: string) => {
    if (!activeProject) return;
    socketService.deleteMessage({ projectId: activeProject.id, messageId });
  }, [activeProject]);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    if (!activeProject) return;
    socketService.addReaction({ projectId: activeProject.id, messageId, emoji });
  }, [activeProject]);

  const removeReaction = useCallback((messageId: string, emoji: string) => {
    if (!activeProject) return;
    socketService.removeReaction({ projectId: activeProject.id, messageId, emoji });
  }, [activeProject]);

  const loadMoreMessages = useCallback(async () => {
    if (!activeProject || isLoading || !hasMore || !oldestMessageIdRef.current) return;
    setIsLoading(true);
    await fetchMessages(activeProject.id, oldestMessageIdRef.current);
    setIsLoading(false);
  }, [activeProject, isLoading, hasMore, fetchMessages]);

  const markAsRead = useCallback(async () => {
    if (!activeProject || unreadCount === 0) return;
    try {
      await apiMarkMessagesAsRead(activeProject.id);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [activeProject, unreadCount]);

  const startTyping = useCallback(() => {
    if (!activeProject) return;
    socketService.startTyping(activeProject.id);
  }, [activeProject]);

  const stopTyping = useCallback(() => {
    if (!activeProject) return;
    socketService.stopTyping(activeProject.id);
  }, [activeProject]);

  const clearLastMessage = useCallback(() => {
    setLastMessage(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        unreadCount,
        typingUsers,
        isLoading,
        hasMore,
        isConnected,
        notificationsEnabled,
        setNotificationsEnabled,
        sendMessage,
        editMessage,
        deleteMessage,
        addReaction,
        removeReaction,
        loadMoreMessages,
        markAsRead,
        startTyping,
        stopTyping,
        setActiveProject,
        lastMessage,
        clearLastMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import {
  MessageSquare,
  Users,
  Search,
  X,
  MoreVertical,
  Bell,
  BellOff,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import type { ChatMessage as ChatMessageType, TypingUser } from '@/types/chat';
import { MessageType } from '@/types/chat';
import type { Project, ProjectMember } from '@/types/project';
import { useAuth } from '@/context/AuthContext';
import {
  getMessages,
  sendMessage as apiSendMessage,
  editMessage as apiEditMessage,
  deleteMessage as apiDeleteMessage,
  addReaction,
  removeReaction,
  markMessagesAsRead,
  getUnreadCount,
  searchMessages,
} from '@/services/chat';
import {
  socketService,
  SocketEvents,
  type MessageReceivePayload,
  type MessageEditPayload,
  type MessageDeletePayload,
  type TypingUpdatePayload,
  type JoinProjectResponse,
} from '@/services/socket';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface ChatPanelProps {
  project: Project;
  members: ProjectMember[];
  isOpen: boolean;
  onClose: () => void;
}

interface TypingIndicator {
  userId: string;
  userName: string;
  timeout?: NodeJS.Timeout;
}

function ChatPanel({ project, members, isOpen, onClose }: ChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState<ChatMessageType | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingIndicator>>(new Map());
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessageType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const oldestMessageIdRef = useRef<string | null>(null);

  const currentUserId = user?.id ?? '';
  const isAdmin = project.currentUserRole === 'ADMIN';

  // Get member name by ID
  const getMemberName = useCallback(
    (userId: string): string => {
      const member = members.find((m) => m.userId === userId);
      return member?.user.name || member?.user.email || 'Unknown';
    },
    [members]
  );

  // Fetch initial messages
  const fetchMessages = useCallback(
    async (before?: string) => {
      try {
        const result = await getMessages(project.id, {
          limit: 50,
          before,
        });

        if (before) {
          setMessages((prev) => [...result.messages, ...prev]);
        } else {
          setMessages(result.messages);
        }

        setHasMore(result.hasMore);

        if (result.messages.length > 0) {
          oldestMessageIdRef.current = result.messages[0].id;
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    },
    [project.id]
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount(project.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [project.id]);

  // Initialize chat
  useEffect(() => {
    if (!isOpen) return;

    const initChat = async () => {
      setIsLoading(true);
      await fetchMessages();
      await fetchUnreadCount();
      setIsLoading(false);
    };

    initChat();
  }, [isOpen, fetchMessages, fetchUnreadCount]);

  // Connect to socket and join project room
  useEffect(() => {
    if (!isOpen || !project.id) return;

    // Connect socket
    socketService.connect();

    const handleConnected = () => {
      setIsConnected(true);
      // Join project room
      socketService.joinProject(project.id).then((response: JoinProjectResponse) => {
        if (response.success) {
          console.info('[Chat] Joined project room:', project.id);
          if (response.unreadCount !== undefined) {
            setUnreadCount(response.unreadCount);
          }
        }
      });
    };

    const handleDisconnected = () => {
      setIsConnected(false);
    };

    if (socketService.isConnected()) {
      handleConnected();
    }

    socketService.on('connected', handleConnected);
    socketService.on('disconnected', handleDisconnected);

    return () => {
      socketService.off('connected', handleConnected);
      socketService.off('disconnected', handleDisconnected);
      socketService.leaveProject();
    };
  }, [isOpen, project.id]);

  // Setup socket event listeners
  useEffect(() => {
    if (!isOpen) return;

    // Handle new messages
    const handleMessageReceive = (payload: MessageReceivePayload) => {
      const { message } = payload;

      // Only add if it's for this project
      if (message.projectId === project.id) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });

        // Scroll to bottom if user is at bottom or message is from current user
        const isOwnMessage = message.senderId === currentUserId;
        if (isOwnMessage) {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }

        // Update unread count if not own message
        if (!isOwnMessage) {
          setUnreadCount((prev) => prev + 1);

          // Show notification
          if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('New message', {
              body: `${message.sender?.name || message.sender?.email}: ${message.content.slice(0, 50)}`,
              icon: '/favicon.ico',
            });
          }
        }
      }
    };

    // Handle message edits
    const handleMessageEdit = (payload: MessageEditPayload) => {
      const { message } = payload;
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? message : m))
      );
    };

    // Handle message deletes
    const handleMessageDelete = (payload: MessageDeletePayload) => {
      const { messageId } = payload;
      setMessages((prev) =>
        prev.filter((m) => m.id !== messageId)
      );
    };

    // Handle typing updates
    const handleTypingUpdate = (payload: TypingUpdatePayload) => {
      const { userId, userName, isTyping } = payload;

      // Don't show typing for self
      if (userId === currentUserId) return;

      setTypingUsers((prev) => {
        const next = new Map(prev);

        // Clear existing timeout
        const existingTimeout = typingTimeoutRefs.current.get(userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        if (isTyping) {
          next.set(userId, { userId, userName });

          // Auto-remove after 5 seconds
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

      // Clear typing timeouts
      typingTimeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutRefs.current.clear();
    };
  }, [isOpen, project.id, currentUserId, notificationsEnabled]);

  // Load more messages
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !oldestMessageIdRef.current) return;

    setIsLoadingMore(true);
    await fetchMessages(oldestMessageIdRef.current);
    setIsLoadingMore(false);
  }, [fetchMessages, hasMore, isLoadingMore]);

  // Send message
  const handleSendMessage = useCallback(
    async (content: string) => {
      try {
        // Optimistic update or wait for socket
        socketService.sendMessage({
          projectId: project.id,
          content,
          replyToId: replyingTo?.id,
        });

        setReplyingTo(null);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [project.id, replyingTo]
  );

  // Edit message
  const handleEditMessage = useCallback(
    async (messageId: string, content: string) => {
      try {
        socketService.editMessage({
          projectId: project.id,
          messageId,
          content,
        });
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
    },
    [project.id]
  );

  // Delete message
  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      try {
        socketService.deleteMessage({
          projectId: project.id,
          messageId,
        });
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    },
    [project.id]
  );

  // Add reaction
  const handleAddReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        socketService.addReaction({
          projectId: project.id,
          messageId,
          emoji,
        });
      } catch (error) {
        console.error('Failed to add reaction:', error);
      }
    },
    [project.id]
  );

  // Remove reaction
  const handleRemoveReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        socketService.removeReaction({
          projectId: project.id,
          messageId,
          emoji,
        });
      } catch (error) {
        console.error('Failed to remove reaction:', error);
      }
    },
    [project.id]
  );

  // Handle reply
  const handleReply = useCallback((message: ChatMessageType) => {
    setReplyingTo(message);
  }, []);

  // Cancel reply
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Typing handlers
  const handleTypingStart = useCallback(() => {
    socketService.startTyping(project.id);
  }, [project.id]);

  const handleTypingStop = useCallback(() => {
    socketService.stopTyping(project.id);
  }, [project.id]);

  // Toggle notifications
  const handleToggleNotifications = useCallback(async () => {
    if (!notificationsEnabled) {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
    setNotificationsEnabled(!notificationsEnabled);
  }, [notificationsEnabled]);

  // Search messages
  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const result = await searchMessages(project.id, query);
        setSearchResults(result.messages);
      } catch (error) {
        console.error('Failed to search messages:', error);
      }
      setIsSearching(false);
    },
    [project.id]
  );

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, handleSearch]);

  // Typing indicator text
  const typingText = useMemo(() => {
    const users = Array.from(typingUsers.values());
    if (users.length === 0) return null;
    if (users.length === 1) return `${users[0].userName} is typing...`;
    if (users.length === 2) return `${users[0].userName} and ${users[1].userName} are typing...`;
    return `${users.length} people are typing...`;
  }, [typingUsers]);

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 w-96">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{project.name}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {members.length} members
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={[
              'p-2 rounded-lg transition-colors',
              showSearch
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
            ].join(' ')}
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleNotifications}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            {notificationsEnabled ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full px-3 py-2 pl-9 text-sm bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            {isSearching && (
              <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 animate-spin" />
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
            <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          <>
            {/* Load more button */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {isLoadingMore ? (
                  <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                ) : (
                  'Load more messages'
                )}
              </button>
            )}

            {/* Messages */}
            {(showSearch && searchQuery ? searchResults : messages).map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                onAddReaction={handleAddReaction}
                onRemoveReaction={handleRemoveReaction}
                onReply={handleReply}
              />
            ))}

            {showSearch && searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                No messages found matching "{searchQuery}"
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Typing indicator */}
      {typingText && (
        <div className="px-4 py-1.5 text-xs text-slate-500 dark:text-slate-400 italic">
          {typingText}
        </div>
      )}

      {/* Connection status */}
      {!isConnected && (
        <div className="px-4 py-1.5 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
          <span className="text-xs text-amber-600 dark:text-amber-400">
            Reconnecting...
          </span>
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
        disabled={!isConnected}
      />
    </div>
  );
}

export default ChatPanel;

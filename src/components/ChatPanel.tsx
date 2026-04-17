import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import {
  MessageSquare,
  Search,
  Bell,
  BellOff,
  Loader2,
  Users,
} from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/types/chat';
import type { Project, ProjectMember } from '@/types/project';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import {
  searchMessages,
} from '@/services/chat';
import { useDebounce } from '@/hooks/useDebounce';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface ChatPanelProps {
  project: Project;
  members: ProjectMember[];
  isOpen: boolean;
  onClose: () => void;
}

function ChatPanel({ project, members, isOpen }: ChatPanelProps) {
  const { user } = useAuth();
  const {
    messages,
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
    typingUsers,
    setActiveProject,
  } = useChat();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [searchResults, setSearchResults] = useState<ChatMessageType[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.id ?? '';
  const isAdmin = project.currentUserRole === 'ADMIN';

  // Set active project for context
  useEffect(() => {
    setActiveProject(project);
    return () => setActiveProject(null);
  }, [project, setActiveProject]);

  const lastScrollHeightRef = useRef<number>(0);
  const isAtBottomRef = useRef<boolean>(true);
  const prevMessagesLength = useRef<number>(messages.length);

  // Mark as read when messages load or change
  useEffect(() => {
    markAsRead();
  }, [messages, markAsRead]);

  // Handle scroll position maintenance and smart scroll-to-bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const messageCountDiff = messages.length - prevMessagesLength.current;

    // If messages were added at the TOP (infinite scroll)
    if (messageCountDiff > 0 && container.scrollTop < 50 && lastScrollHeightRef.current > 0) {
      const newScrollHeight = container.scrollHeight;
      container.scrollTop = newScrollHeight - lastScrollHeightRef.current;
    }
    // If a NEW message was added at the BOTTOM
    else if (messageCountDiff > 0 && (isAtBottomRef.current || messages[messages.length - 1].senderId === currentUserId)) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevMessagesLength.current = messages.length;
    lastScrollHeightRef.current = container.scrollHeight;
  }, [messages, currentUserId]);

  // Handle auto-scroll on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 200);
    }
  }, [isOpen]);

  // Scroll listener for infinite scroll and tracking bottom status
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;

      // Check if we are at the bottom (with some threshold)
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;

      // Update last known scroll height for next render
      lastScrollHeightRef.current = scrollHeight;

      // Trigger load more when near top
      if (scrollTop < 100 && hasMore && !isLoading) {
        loadMoreMessages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, loadMoreMessages]);

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
    handleSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, handleSearch]);

  const [replyingTo, setReplyingTo] = useState<ChatMessageType | null>(null);

  const handleSendMessage = useCallback(
    async (content: string) => {
      sendMessage(content, replyingTo?.id);
      setReplyingTo(null);
      // Auto-scroll when explicitly sending a new message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    },
    [sendMessage, replyingTo]
  );

  const handleScrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('!bg-olive-100', 'dark:!bg-olive-900/50', 'transition-colors', 'duration-500');
      setTimeout(() => {
        el.classList.remove('!bg-olive-100', 'dark:!bg-olive-900/50');
      }, 2000);
    }
  }, []);

  const typingText = useMemo(() => {
    const users = Array.from(typingUsers.values());
    if (users.length === 0) return null;
    if (users.length === 1) return `${users[0].userName} is typing...`;
    if (users.length === 2) return `${users[0].userName} and ${users[1].userName} are typing...`;
    return `${users.length} people are typing...`;
  }, [typingUsers]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative border-none">
      {/* Professional Clean Header */}
      <div className="shrink-0 px-8 py-5 h-[72px] bg-white dark:bg-slate-900 flex items-center justify-between z-20 border-b border-zinc-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="p-2.5 bg-olive-50 dark:bg-olive-900/30 rounded-xl border border-olive-100 dark:border-olive-800/50 text-olive-600 dark:text-olive-500">
              <MessageSquare className="w-[18px] h-[18px]" strokeWidth={2.5} />
            </div>
            {isConnected && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            )}
          </div>
          <div className="flex flex-col">
            <h3 className="text-olive-950 dark:text-white font-bold text-[1.1rem] tracking-tight leading-tight">{project.name}</h3>
            <div className="flex items-center gap-2 text-zinc-500 dark:text-slate-400 text-[0.7rem] font-semibold mt-0.5">
              <span className="flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                {members.length} Members
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-slate-600" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={[
              'p-2 rounded-xl transition-all duration-200',
              showSearch
                ? 'bg-olive-50 text-olive-600 shadow-inner scale-95'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-slate-400 dark:hover:bg-slate-800 active:scale-90',
            ].join(' ')}
            title="Search messages"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className="p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all active:scale-90"
            title={notificationsEnabled ? 'Mute' : 'Unmute'}
          >
            {notificationsEnabled ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Search area (conditionally rendered below header) */}
      {showSearch && (
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 animate-in slide-in-from-top duration-300">
          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in conversation..."
              className="w-full px-4 py-2.5 pl-11 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-olive-500/30 transition-all group-hover:border-slate-300 dark:group-hover:border-slate-600"
            />
            <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400 group-focus-within:text-olive-500 transition-colors" />
            {isSearching && (
              <Loader2 className="absolute right-4 top-3 w-4 h-4 text-slate-400 animate-spin" />
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-1.5 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/20"
      >
        {isLoading && messages.length === 0 ? (
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
                onClick={loadMoreMessages}
                disabled={isLoading}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                ) : (
                  'Load more messages'
                )}
              </button>
            )}

            {/* Messages List */}
            {(() => {
              const displayMessages = showSearch && searchQuery ? searchResults : messages;
              let lastDateLabel = '';

              const getDateLabel = (dateString: string): string => {
                const date = new Date(dateString);
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

                if (msgDate.getTime() === today.getTime()) return 'Today';
                if (msgDate.getTime() === yesterday.getTime()) return 'Yesterday';
                return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
              };

              return displayMessages.map((message) => {
                const dateLabel = getDateLabel(message.createdAt);
                const showSeparator = dateLabel !== lastDateLabel;
                lastDateLabel = dateLabel;

                return (
                  <div key={message.id}>
                    {showSeparator && (
                      <div className="flex items-center gap-4 py-4 px-6">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/60" />
                        <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 select-none whitespace-nowrap">
                          {dateLabel}
                        </span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/60" />
                      </div>
                    )}
                    <ChatMessage
                      message={message}
                      currentUserId={currentUserId}
                      currentUserEmail={user?.email}
                      isAdmin={isAdmin}
                      onEdit={editMessage}
                      onDelete={deleteMessage}
                      onAddReaction={addReaction}
                      onRemoveReaction={removeReaction}
                      onReply={(m) => setReplyingTo(m)}
                      onLoadThread={handleScrollToMessage}
                    />
                  </div>
                );
              });
            })()}

            {showSearch && searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                No messages found matching "{searchQuery}"
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Footer Area */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        {/* Typing indicator */}
        {typingText && (
          <div className="px-4 py-1.5 text-xs text-slate-500 dark:text-slate-400 italic">
            {typingText}
          </div>
        )}

        {/* Connection status (Floating overlay) */}
        {!isConnected && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50">
            <div className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Reconnecting to Chat...
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4">
          <ChatInput
            onSendMessage={handleSendMessage}
            onTypingStart={startTyping}
            onTypingStop={stopTyping}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            disabled={!isConnected}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;

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
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';

export interface ChatPanelProps {
  project: Project;
  members: ProjectMember[];
  isOpen: boolean;
  onClose: () => void;
}

export function ChatPanel({ project, members, isOpen }: ChatPanelProps) {
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

    if (messageCountDiff > 0 && container.scrollTop < 50 && lastScrollHeightRef.current > 0) {
      const newScrollHeight = container.scrollHeight;
      container.scrollTop = newScrollHeight - lastScrollHeightRef.current;
    } else if (messageCountDiff > 0 && (isAtBottomRef.current || messages[messages.length - 1].senderId === currentUserId)) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevMessagesLength.current = messages.length;
  }, [messages, currentUserId]);

  // Infinite scroll up handler
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;

    if (scrollTop === 0 && hasMore && !isLoading) {
      lastScrollHeightRef.current = scrollHeight;
      void loadMoreMessages();
    }
  };

  // Search execution
  const handleSearch = useCallback(async () => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchMessages(project.id, debouncedSearchQuery.trim());
      setSearchResults(results.messages);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [project.id, debouncedSearchQuery]);

  useEffect(() => {
    void handleSearch();
  }, [handleSearch]);

  const [replyingTo, setReplyingTo] = useState<ChatMessageType | null>(null);

  const activeTypingUsers = useMemo(
    () => Array.from(typingUsers.values()).filter(u => u.userId !== currentUserId),
    [typingUsers, currentUserId]
  );

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-white relative font-sans">
      {/* Header */}
      <div className="px-5 py-4 border-b border-olive-200/80 bg-white flex items-center justify-between shadow-xs z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-olive-50 border border-olive-100 flex items-center justify-center text-olive-700 font-bold shrink-0">
            <MessageSquare size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-olive-950 truncate tracking-tight m-0">
                {project.name}
              </h3>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
                title={isConnected ? 'Connected' : 'Reconnecting...'}
              />
            </div>
            <p className="text-[11px] text-olive-500 font-medium truncate m-0">
              {members.length} member{members.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg transition-colors ${
              showSearch
                ? 'bg-olive-100 text-olive-700'
                : 'text-olive-500 hover:bg-olive-50 hover:text-olive-800'
            }`}
            title="Search channel history"
            type="button"
          >
            <Search size={16} />
          </button>
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              notificationsEnabled
                ? 'text-olive-700 hover:bg-olive-50'
                : 'text-olive-400 hover:bg-olive-50'
            }`}
            title={notificationsEnabled ? 'Mute notifications' : 'Enable notifications'}
            type="button"
          >
            {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
          </button>
        </div>
      </div>

      {/* Search Input Banner */}
      {showSearch && (
        <div className="p-3 bg-olive-50/80 border-b border-olive-200 animate-in slide-in-from-top-2 duration-200 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-olive-400" size={14} />
            <input
              type="text"
              placeholder="Search in message history..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-olive-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-olive-500/20"
            />
          </div>
        </div>
      )}

      {/* Main Messages scroll list */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4"
      >
        {isLoading && hasMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="animate-spin text-olive-500" size={18} />
          </div>
        )}

        {showSearch && searchQuery.trim() ? (
          <div>
            <div className="text-[11px] font-bold text-olive-400 uppercase tracking-widest mb-3">
              Search Results ({searchResults.length})
            </div>
            {isSearching ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-olive-500" size={18} />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-xs text-olive-400">
                No matching messages found
              </div>
            ) : (
              searchResults.map(msg => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                  onAddReaction={addReaction}
                  onRemoveReaction={removeReaction}
                  onReply={msgToReply => setReplyingTo(msgToReply)}
                />
              ))
            )}
          </div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-olive-400 py-12">
                <Users size={32} className="opacity-30 mb-2" />
                <p className="text-xs font-semibold m-0">No chat messages yet</p>
                <p className="text-[11px] mt-1 m-0">Start the conversation with your team!</p>
              </div>
            ) : (
              messages.map(msg => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                  onAddReaction={addReaction}
                  onRemoveReaction={removeReaction}
                  onReply={msgToReply => setReplyingTo(msgToReply)}
                />
              ))
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator Bar */}
      {activeTypingUsers.length > 0 && (
        <div className="px-5 py-1 text-[11px] font-medium text-olive-500 italic bg-white border-t border-olive-100 flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 bg-olive-500 rounded-full animate-ping" />
          <span>
            {activeTypingUsers.map(u => u.userName).join(', ')} {activeTypingUsers.length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}

      {/* Chat Input Container */}
      <div className="p-3 bg-white border-t border-olive-200/80 shrink-0">
        <ChatInput
          onSendMessage={(content) => {
            sendMessage(content, replyingTo?.id);
            setReplyingTo(null);
          }}
          onTypingStart={startTyping}
          onTypingStop={stopTyping}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
    </div>
  );
}

export default ChatPanel;
